from keybert import KeyBERT
from kiwipiepy import Kiwi

class KeywordExtractor:
    """
    한국어 키워드 추출기.
    Kiwi(한국어 형태소 분석기)로 명사를 추출하고,
    KeyBERT로 문맥상 중요한 키워드를 선별합니다.
    """

    def __init__(self):
        print("[INFO] Loading KeyBERT and Kiwi...")
        self.kw_model = KeyBERT('paraphrase-multilingual-MiniLM-L12-v2')
        self.kiwi = Kiwi()

    def extract_keywords(self, text, top_n=3):
        """
        텍스트에서 핵심 키워드(명사)를 추출합니다.

        Args:
            text: 일기 텍스트
            top_n: 추출할 키워드 수

        Returns:
            ["딸기", "아빠", "꽃"] 형태의 리스트
        """
        # 1. Kiwi로 명사 추출 (NNG: 일반명사, NNP: 고유명사)
        tokens = self.kiwi.tokenize(text)
        nouns = list(set([
            t.form for t in tokens
            if t.tag in ('NNG', 'NNP')
        ]))

        if not nouns:
            return []

        # 명사가 top_n 이하면 그대로 반환 (KeyBERT 불필요)
        if len(nouns) <= top_n:
            return nouns

        # 2. KeyBERT로 가장 중요한 키워드 선별
        try:
            keywords = self.kw_model.extract_keywords(
                text,
                candidates=nouns,
                top_n=top_n
            )
            return [kw[0] for kw in keywords]
        except Exception as e:
            print(f"[WARN] KeyBERT failed, using Kiwi nouns: {e}")
            return nouns[:top_n]


# 테스트
if __name__ == "__main__":
    extractor = KeywordExtractor()

    tests = [
        "오늘 아빠랑 딸기 먹어서 너무 행복했어",
        "산책하면서 예쁜 꽃을 봤어. 아기도 같이 보았으면 좋겠다",
        "병원에서 초음파 검사했는데 아기가 건강하대",
    ]

    for text in tests:
        print(f"\n📝 '{text}'")
        print(f"   🔑 {extractor.extract_keywords(text)}")
