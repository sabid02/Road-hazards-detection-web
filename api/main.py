from fastapi import FastAPI, UploadFile, File
from detect import read_imagefile, detect_objects
from database import get_db
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
db = get_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods like POST, GET
    allow_headers=["*"],  # Allow all headers
)
collection = db["detections"]


@app.post("/detect/")
async def detect(
    file: UploadFile = File(...), latitude: float = 0.0, longitude: float = 0.0
):
    contents = await file.read()
    image = read_imagefile(contents)
    detections = detect_objects(image)

    if detections:
        record = {
            "detections": detections,
            "location": {"latitude": latitude, "longitude": longitude},
            "timestamp": datetime.utcnow(),
        }
        collection.insert_one(record)
        return {"message": "Detections saved", "detections": detections}
    else:
        return {"message": "No detections"}


@app.get("/")
def root():
    return {"message": "Pothole Detection Backend Running!"}
