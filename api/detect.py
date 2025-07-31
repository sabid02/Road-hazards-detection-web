import cv2
import numpy as np
import tempfile
import os
import logging
import time
from ultralytics import YOLO
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load YOLO model
model = YOLO("models/best.pt")


def read_imagefile(file) -> np.ndarray:
    file_bytes = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image decoding failed — OpenCV returned None.")
    return img


def detect_objects(image: np.ndarray, conf: float = 0.50):
    # Frame quality check
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    std_dev = np.std(gray)
    if mean_brightness < 35 or std_dev < 25:
        logger.info(
            f"Skipping detection: brightness={mean_brightness:.2f}, std_dev={std_dev:.2f}"
        )
        return []

    # Preprocess: Enhance contrast and brightness
    image = cv2.convertScaleAbs(image, alpha=1.5, beta=40)

    results = model.predict(source=image, conf=conf, save=False)
    detections = []
    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        confidences = r.boxes.conf.cpu().numpy()
        class_names = [model.names[int(cls_id)] for cls_id in class_ids]
        for box, class_id, confidence, class_name in zip(
            boxes, class_ids, confidences, class_names
        ):
            if class_name == "crack" and confidence > 0.85:
                logger.warning(
                    f"High-confidence crack detected: confidence={confidence:.2f}"
                )
                cv2.imwrite(f"debug_frame_{int(time.time())}.jpg", image)
            detections.append(
                {
                    "class_id": int(class_id),
                    "class_name": class_name,
                    "confidence": float(confidence),
                    "bbox": box.tolist(),
                }
            )
    return detections


def detect_objects_in_video(video_bytes: bytes, conf: float = 0.5):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name
    try:
        cap = cv2.VideoCapture(tmp_path)
        all_detections = []
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % 10 == 0:
                # Apply quality check for video frames
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                mean_brightness = np.mean(gray)
                std_dev = np.std(gray)
                if mean_brightness < 35 or std_dev < 25:
                    logger.info(
                        f"Skipping video frame {frame_count}: brightness={mean_brightness:.2f}, std_dev={std_dev:.2f}"
                    )
                    continue
                frame = cv2.convertScaleAbs(frame, alpha=1.5, beta=50)
                results = model.predict(source=frame, conf=conf, save=False)
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
    finally:
        os.remove(tmp_path)


def generate_frames(
    source=0, fps: float = 15.0, conf: float = 0.75, db=None, skip_frames: int = 3
):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        logger.error(f"Could not open video source: {source}")
        raise RuntimeError(f"Could not open video source: {source}")

    frame_delay = 1.0 / fps
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            logger.info("End of video stream")
            break

        if frame_count % skip_frames != 0:
            ret, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            frame_count += 1
            time.sleep(frame_delay)
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        std_dev = np.std(gray)
        if mean_brightness < 35 or std_dev < 25:
            logger.info(
                f"Skipping frame: brightness={mean_brightness:.2f}, std_dev={std_dev:.2f}"
            )
            ret, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            yield (
                b"--frame\r\n"
                b"Content-Type: text/plain\r\n\r\nSkipped: Camera obstructed\r\n"
            )
            frame_count += 1
            time.sleep(frame_delay)
            continue

        frame = cv2.convertScaleAbs(frame, alpha=1.5, beta=50)
        results = model.predict(source=frame, conf=conf, save=False)
        detections = []
        for r in results:
            for cls_id, conf_score, box in zip(r.boxes.cls, r.boxes.conf, r.boxes.xyxy):
                class_name = model.names[int(cls_id)]
                if class_name == "crack" and conf_score > 0.85:
                    logger.warning(
                        f"High-confidence crack detected: confidence={conf_score:.2f}"
                    )
                    cv2.imwrite(f"debug_frame_{int(time.time())}.jpg", frame)
                detections.append(
                    {
                        "class_id": int(cls_id),
                        "class_name": class_name,
                        "confidence": float(conf_score),
                        "bbox": box.tolist(),
                    }
                )
                x1, y1, x2, y2 = map(int, box)
                label = f"{class_name}: {conf_score:.2f}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    frame,
                    label,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                )

        if db and detections:
            db["detections"].insert_one(
                {
                    "detections": detections,
                    "location": {"latitude": 0.0, "longitude": 0.0},
                    "timestamp": datetime.now(timezone.utc),
                    "source": "live-stream",
                }
            )

        ret, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )
        frame_count += 1
        time.sleep(frame_delay)

    cap.release()
