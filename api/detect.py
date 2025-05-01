from ultralytics import YOLO
import cv2
import numpy as np
import tempfile
import os
from fastapi.responses import StreamingResponse

# Load your YOLO model once
model = YOLO("models/best1.pt")


def read_imagefile(file) -> np.ndarray:
    file_bytes = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image decoding failed — OpenCV returned None.")
    return img


def detect_objects(image: np.ndarray):
    results = model.predict(source=image, conf=0.5, save=False)
    detections = []

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        confidences = r.boxes.conf.cpu().numpy()
        class_names = [model.names[int(cls_id)] for cls_id in class_ids]

        for box, class_id, confidence, class_name in zip(
            boxes, class_ids, confidences, class_names
        ):
            detections.append(
                {
                    "class_id": int(class_id),
                    "class_name": class_name,
                    "confidence": float(confidence),
                    "bbox": box.tolist(),
                }
            )

    return detections


def detect_objects_in_video(video_bytes: bytes):
    # Write video bytes to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    all_detections = []
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % 10 == 0:  # Detect every 10th frame to save processing
            results = model.predict(source=frame, conf=0.5, save=False)
            for r in results:
                class_ids = r.boxes.cls.cpu().numpy()
                confidences = r.boxes.conf.cpu().numpy()
                class_names = [model.names[int(cls_id)] for cls_id in class_ids]

                for class_id, confidence, class_name in zip(
                    class_ids, confidences, class_names
                ):
                    all_detections.append(
                        {
                            "class_id": int(class_id),
                            "class_name": class_name,
                            "confidence": float(confidence),
                            "frame": frame_count,
                        }
                    )
        frame_count += 1

    cap.release()
    return all_detections


def generate_frames(source=0):
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        raise RuntimeError("Could not open video source.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLOv8 prediction on the frame
        results = model.predict(source=frame, conf=0.5, save=False)

        for r in results:
            for box in r.boxes.xyxy:
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Encode frame to JPEG
        ret, buffer = cv2.imencode(".jpg", frame)
        frame = buffer.tobytes()

        # Yield frame in streaming format
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")

    cap.release()
