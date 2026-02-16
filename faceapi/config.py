import os
from pathlib import Path
from dotenv import load_dotenv

# faceapi/.env 또는 프로젝트 루트 .env 둘 다 탐색
load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    AILAB_API_KEY = os.getenv("AILAB_API_KEY")
    HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    UPLOAD_FOLDER = "./uploads/"
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
