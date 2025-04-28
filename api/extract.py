import pytesseract
import cv2
import re
import numpy as np


pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"


def extract_coordinates_from_image_bytes(image_bytes):
    image_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    # ✨ PRE-PROCESS
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Convert to gray
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[
        1
    ]  # Binarize (black & white)

    # ✨ OCR on processed image
    text = pytesseract.image_to_string(gray)

    # print("OCR Text:", text)  # 👈 always print to debug

    lat_lon_pattern = r"([-+]?\d{1,3}\.\d+)[^\d]+([-+]?\d{1,3}\.\d+)"
    matches = re.findall(lat_lon_pattern, text)

    if matches:
        latitude, longitude = matches[0]
        return float(latitude), float(longitude)

    return None, None


def extract_coordinates_from_video_bytes(video_bytes):
    with open("temp_video.mp4", "wb") as f:
        f.write(video_bytes)

    cap = cv2.VideoCapture("temp_video.mp4")

    frame_count = 0
    success = True

    while success:
        success, frame = cap.read()

        if not success:
            break

        frame_count += 1

        if frame_count % 30 == 0:
            # ✨ PRE-PROCESS video frame
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

            text = pytesseract.image_to_string(gray)

            # print("OCR Frame Text:", text)  # 👈 see what it reads

            lat_lon_pattern = r"([-+]?\d{1,3}\.\d+)[^\d]+([-+]?\d{1,3}\.\d+)"
            matches = re.findall(lat_lon_pattern, text)

            if matches:
                latitude, longitude = matches[0]
                cap.release()
                return float(latitude), float(longitude)

    cap.release()
    return None, None
