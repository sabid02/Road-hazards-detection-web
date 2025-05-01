from fastapi import FastAPI, UploadFile, HTTPException, File, Depends
from detect import read_imagefile, detect_objects, detect_objects_in_video
from database import get_db
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from extract import (
    extract_coordinates_from_image_bytes,
    extract_coordinates_from_video_bytes,
)
from detect import generate_frames
from fastapi.responses import StreamingResponse
import base64
from pydantic import BaseModel


import traceback


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods like POST, GET
    allow_headers=["*"],  # Allow all headers
)


@app.post("/detect/")
async def detect(file: UploadFile = File(...), db=Depends(get_db)):
    collection = db["detections"]
    contents = await file.read()

    if file.content_type.startswith("image/"):
        latitude, longitude = extract_coordinates_from_image_bytes(contents)
        image = read_imagefile(contents)
        detections = detect_objects(image)

    elif file.content_type.startswith("video/"):
        latitude, longitude = extract_coordinates_from_video_bytes(contents)
        detections = detect_objects_in_video(contents)

    else:
        return {"message": "Unsupported file type"}

    if detections:
        record = {
            "detections": detections,
            "location": {"latitude": latitude, "longitude": longitude},
            "timestamp": datetime.now(timezone.utc),
        }
        collection.insert_one(record)
        return {
            "message": "Detections saved",
            "detections": detections,
            "latitude": latitude,
            "longitude": longitude,
        }

    return {
        "message": "No detections",
        "latitude": latitude,
        "longitude": longitude,
    }


@app.get("/")
def root():
    return {"message": "Pothole Detection Backend Running!"}


db = get_db()
print(db.list_collection_names())
print("MongoDB connection established successfully.")


@app.get("/locations/")
async def get_locations(db=Depends(get_db)):
    collection = db["detections"]
    cursor = collection.find({}, {"location": 1, "detections.class_name": 1, "_id": 0})
    locations = list(cursor)  # <-- Important: make it a list first!

    for location in locations:
        print("location: ", location)

    return [
        {
            "location": location["location"],
            "class_name": location["detections"][0]["class_name"],
        }
        for location in locations
    ]


# @app.post("/live-stream")
# def live_stream():
#     return StreamingResponse(
#         generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame"
#     )


class ImagePayload(BaseModel):
    image: str  # base64-encoded image
    latitude: float | None = None
    longitude: float | None = None


@app.post("/detect-image")
async def detect_image(payload: ImagePayload, db=Depends(get_db)):
    try:
        print("[INFO] Received image data...")

        # Handle optional prefix for base64 image
        if "," in payload.image:
            _, encoded = payload.image.split(",", 1)
        else:
            encoded = payload.image

        print("[INFO] Decoding base64 image...")
        image_bytes = base64.b64decode(encoded)

        print("[INFO] Reading image with OpenCV...")
        img = read_imagefile(image_bytes)

        print("[INFO] Running detection...")
        detections = detect_objects(img)

        print("[INFO] Detection complete.")

        # Send back detections with the received latitude and longitude
        if not detections:
            return {
                "detections": [],
                "message": "No detections found",
                "latitude": payload.latitude
                or 0.0,  # Default to 0.0 if latitude is None
                "longitude": payload.longitude
                or 0.0,  # Default to 0.0 if longitude is None
            }

        return {
            "detections": detections,
            "latitude": payload.latitude or 0.0,  # Default to 0.0 if latitude is None
            "longitude": payload.longitude
            or 0.0,  # Default to 0.0 if longitude is None
        }

    except Exception as e:
        print("[ERROR] Failed to process image:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
