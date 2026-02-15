def generate_fetal_prompt(sentiment_data, keywords):
    """
    감정 분석 결과와 키워드를 바탕으로
    '태아가 상상한 엄마의 하루' 스타일의 프롬프트를 생성합니다.
    """
    emotion = sentiment_data.get("label", "Happy")
    keyword_str = ", ".join(keywords)

    # 스타일 템플릿 (어린아이의 크레파스 그림체)
    base_prompt = (
        "Child's crayon drawing, naive art style, cute and colorful. "
        "A scene depicting: {keywords}. "
        "Atmosphere: {emotion}, warm lighting. "
        "On white paper, rough texture, scribbles. "
        "No text, no watermarks."
    )

    final_prompt = base_prompt.format(
        keywords=keyword_str,
        emotion=emotion
    )

    return final_prompt

# 기존 함수 유지 (혹시 모를 하위 호환성)
def generate_prompt(parent1_features, parent2_features):
    # ... (Legacy code omitted for brevity, but should be kept if needed)
    return "Legacy prompt logic..."
