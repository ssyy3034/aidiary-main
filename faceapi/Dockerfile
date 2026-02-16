# 베이스 이미지
FROM python:3.11-slim

# 작업 디렉터리 생성
WORKDIR /app

# 패키지 설치 (캐시 활용을 위해 requirements.txt만 먼저 복사)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 모델을 Docker 이미지에 Bake (콜드 스타트 방지)
RUN python -c "\
    from transformers import pipeline; \
    pipeline('sentiment-analysis', model='cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual'); \
    print('[INFO] Sentiment model baked into image.') \
    "

RUN python -c "\
    from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2'); \
    print('[INFO] Sentence Transformer model baked into image.') \
    "

# 소스 복사
COPY . /app

# Flask 서버 포트
EXPOSE 5001

# Flask 서버 실행
CMD ["python", "app.py"]
