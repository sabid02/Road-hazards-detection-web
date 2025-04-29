from ultralytics import YOLO
import cv2
import numpy as np
import tempfile

# Load your YOLO model once
model = YOLO("models/best1.pt")


def read_imagefile(file) -> np.ndarray:
    file_bytes = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
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
