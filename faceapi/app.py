import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from config import Config
from routes.analysis_routes import analysis_bp
from routes.chat_routes import chat_bp

# .env 파일 로드
load_dotenv()

app = Flask(__name__)

# CORS 설정
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["*"]
}})

# 업로드 폴더 생성
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Blueprint 등록
app.register_blueprint(analysis_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
