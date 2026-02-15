import torch
from transformers import pipeline

class SentimentAnalyzer:
    """
    한국어 감정 분석기.
    다국어 감정 분석 모델을 사용하여 일기 텍스트에서
    긍정/부정/중립을 분류한 뒤, 일기 맥락에 맞는 감정 라벨로 매핑합니다.
    """

    # 모델 출력 → 일기 감정 매핑
    SENTIMENT_TO_EMOTION = {
        "positive": "happy",
        "negative": "sad",
        "neutral": "calm",
    }

    def __init__(self):
        """
        다국어 감정 분석 파이프라인 로드.
        cardiffnlp 모델은 ~500MB로 가볍고, 한국어를 포함한 다국어를 지원합니다.
        """
        print("[INFO] SentimentAnalyzer loading on CPU...")

        self.classifier = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual",
            device=-1,  # CPU
            top_k=None  # 모든 라벨의 점수 반환
        )
        print("[INFO] SentimentAnalyzer ready.")

    def analyze(self, text):
        """
        텍스트의 감정을 분석합니다.

        Args:
            text: 일기 텍스트

        Returns:
            {
                "label": "happy",
                "score": 0.85,
                "all_scores": {"positive": 0.85, "neutral": 0.10, "negative": 0.05}
            }
        """
        results = self.classifier(text[:512])  # 최대 512 토큰

        # top_k=None이면 리스트의 리스트로 반환됨
        scores = results[0] if isinstance(results[0], list) else results

        # 점수 딕셔너리로 정리
        all_scores = {
            item["label"]: round(item["score"], 4)
            for item in scores
        }

        # 가장 높은 점수의 라벨
        top = max(scores, key=lambda x: x["score"])
        emotion = self.SENTIMENT_TO_EMOTION.get(top["label"], "calm")

        return {
            "label": emotion,
            "score": round(top["score"], 4),
            "all_scores": all_scores
        }

# 테스트
if __name__ == "__main__":
    analyzer = SentimentAnalyzer()

    tests = [
        "오늘 딸기 먹어서 너무 행복해",
        "아기가 보고 싶어서 눈물이 났어",
        "회사 일이 너무 많아서 지쳤어",
    ]

    for text in tests:
        print(f"\n📝 '{text}'")
        print(f"   → {analyzer.analyze(text)}")
