from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the MongoDB URL from the environment variables
MONGO_URL = os.getenv(
    "MONGO_URL", "mongodb://localhost:27017/"
)  # Default to localhost if not set


def get_db():
    client = MongoClient(MONGO_URL)
    db = client["pothole_detection"]  # Replace with your DB name
    return db
