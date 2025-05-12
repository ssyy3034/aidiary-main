# 베이스 이미지
FROM python:3.9

# 작업 디렉터리 생성
WORKDIR /app

# 소스 복사
COPY . /app

# 패키지 설치
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Flask 서버 포트
EXPOSE 5001

# Flask 서버 실행
CMD ["python", "app.py"]
