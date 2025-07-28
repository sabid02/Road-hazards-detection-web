from fastapi import FastAPI, UploadFile, HTTPException, File, Depends
from detect import (
    read_imagefile,
    detect_objects,
    detect_objects_in_video,
    generate_frames,
)
from database import get_db
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from extract import (
    extract_coordinates_from_image_bytes,
    extract_coordinates_from_video_bytes,
)
from fastapi.responses import StreamingResponse
import base64
from pydantic import BaseModel
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/detect/")
async def detect(file: UploadFile = File(...), db=Depends(get_db)):
    collection = db["detections"]
    contents = await file.read()
    if file.content_type.startswith("image/"):
        latitude, longitude = extract_coordinates_from_image_bytes(contents)
        image = read_imagefile(contents)
        detections = detect_objects(image, conf=0.5)  # Keep original conf for /detect/
    elif file.content_type.startswith("video/"):
        latitude, longitude = extract_coordinates_from_video_bytes(contents)
        detections = detect_objects_in_video(contents, conf=0.5)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
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
    locations = list(cursor)
    for location in locations:
        print("location: ", location)
    return [
        {
            "location": location["location"],
            "class_name": location["detections"][0]["class_name"],
        }
        for location in locations
    ]


class ImagePayload(BaseModel):
    image: str
    latitude: float | None = None
    longitude: float | None = None
    conf: float = 0.75


@app.post("/live-stream/")
async def live_stream(payload: ImagePayload, db=Depends(get_db)):
    try:
        print("[INFO] Received image data...")
        if not payload.image:
            raise HTTPException(status_code=400, detail="No image data provided")

        # Handle base64 prefix
        encoded = payload.image
        if "," in payload.image:
            _, encoded = payload.image.split(",", 1)

        print("[INFO] Decoding base64 image...")
        try:
            image_bytes = base64.b64decode(encoded)
        except base64.binascii.Error as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid base64 encoding: {str(e)}"
            )

        print("[INFO] Reading image with OpenCV...")
        img = read_imagefile(image_bytes)
        print("[INFO] Running detection...")
        detections = detect_objects(img, conf=payload.conf)
        print("[INFO] Detection complete.")

        if detections:
            db["detections"].insert_one(
                {
                    "detections": detections,
                    "location": {
                        "latitude": payload.latitude or 0.0,
                        "longitude": payload.longitude or 0.0,
                    },
                    "timestamp": datetime.now(timezone.utc),
                    "source": "live-stream",
                }
            )

        return {
            "detections": detections,
            "message": "No detections found" if not detections else "Detections saved",
            "latitude": payload.latitude or 0.0,
            "longitude": payload.longitude or 0.0,
        }
    except Exception as e:
        print("[ERROR] Failed to process image:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=400, detail=f"Failed to process image: {str(e)}"
        )


@app.get("/live-stream/")
async def live_stream_mjpeg(conf: float = 0.75, fps: float = 15.0, db=Depends(get_db)):
    try:
        return StreamingResponse(
            generate_frames(source=0, fps=fps, conf=conf, db=db),
            media_type="multipart/x-mixed-replace; boundary=frame",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
