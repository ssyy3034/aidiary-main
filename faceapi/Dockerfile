# 베이스 이미지
FROM python:3.11-slim

# OpenCV + MediaPipe 시스템 의존성
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉터리 생성
WORKDIR /app

# 패키지 설치 (캐시 활용을 위해 requirements.txt만 먼저 복사)
COPY requirements.txt .

# 1. CPU-only PyTorch 설치 (속도 개선 핵심)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. 나머지 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 3. 모델 미리 다운로드 (빌드 시점에 모델 포함)
COPY warmup.py .
RUN python warmup.py && rm warmup.py

# 소스 복사
COPY . /app

# Flask 서버 포트
EXPOSE 5001

# Flask 서버 실행
CMD ["python", "app.py"]
