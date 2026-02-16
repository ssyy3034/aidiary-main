
print("🔥 Warming up models for Docker build...")

# 1. Hugging Face Sentiment Analysis
from transformers import pipeline
print("Downloading Sentiment Analysis model...")
pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual",
    device=-1
)

# 2. KeyBERT
from sentence_transformers import SentenceTransformer
print("Downloading KeyBERT model...")
# KeyBERT uses SentenceTransformer under the hood
SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("Downloading all-MiniLM-L6-v2 for RAG...")
SentenceTransformer('all-MiniLM-L6-v2')

print("✅ All models downloaded successfully.")
