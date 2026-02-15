import os
import uuid
from werkzeug.utils import secure_filename
from config import Config

def allowed_file(filename):
    """허용된 파일 확장자인지 확인"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_file(file, prefix):
    """보안이 강화된 파일 저장 함수"""
    if not file or file.filename == '':
        raise ValueError("파일이 제공되지 않았습니다.")

    if not allowed_file(file.filename):
        raise ValueError(f"허용되지 않는 파일 형식입니다. 허용: {Config.ALLOWED_EXTENSIONS}")

    # 업로드 디렉토리 확인 및 생성
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # 고유한 파일명 생성 (UUID 사용)
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(unique_filename)

    file_path = os.path.join(Config.UPLOAD_FOLDER, safe_filename)
    file.save(file_path)

    # 파일 크기 검증
    if os.path.getsize(file_path) > Config.MAX_FILE_SIZE:
        os.remove(file_path)
        raise ValueError(f"파일 크기가 {Config.MAX_FILE_SIZE // (1024*1024)}MB를 초과합니다.")

    print(f"[INFO] File saved: {file_path} (Size: {os.path.getsize(file_path)} bytes)")
    return file_path
