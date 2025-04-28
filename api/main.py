from fastapi import FastAPI, UploadFile, File, Depends
from detect import read_imagefile, detect_objects
from database import get_db
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from extract import (
    extract_coordinates_from_image_bytes,
    extract_coordinates_from_video_bytes,
)


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
    elif file.content_type.startswith("video/"):
        latitude, longitude = extract_coordinates_from_video_bytes(contents)
        image = None
    else:
        return {"message": "Unsupported file type"}

    # 👇👇 ADD THESE PRINTS for debugging
    print("File received:", file.filename)
    print("Latitude extracted:", latitude)
    print("Longitude extracted:", longitude)

    if image is not None:
        detections = detect_objects(image)

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
        else:
            return {
                "message": "No detections",
                "latitude": latitude,
                "longitude": longitude,
            }

    return {
        "message": "Video uploaded. GPS extracted",
        "latitude": latitude,
        "longitude": longitude,
    }


@app.get("/")
def root():
    return {"message": "Pothole Detection Backend Running!"}


db = get_db()
print(db.list_collection_names())
print("MongoDB connection established successfully.")
