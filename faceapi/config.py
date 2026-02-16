import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    AILAB_API_KEY = os.getenv("AILAB_API_KEY")
    HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
    UPLOAD_FOLDER = "./uploads/"
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
