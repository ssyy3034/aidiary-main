def generate_prompt(parent1_features, parent2_features):
    """
    부모의 얼굴 특징을 기반으로 GPT에 전달할 프롬프트 생성

    Args:
        parent1_features (dict): 부모 1의 얼굴 특징
        parent2_features (dict): 부모 2의 얼굴 특징

    Returns:
        str: 생성된 GPT 프롬프트
    """
    p1_gender = parent1_features.get("gender", "Unknown")
    p1_age = parent1_features.get("age", "Unknown")
    p1_emotion = parent1_features.get("emotion", "Unknown")
    p1_smile = parent1_features.get("smile", 0)
    p1_beauty = parent1_features.get("beauty", 0)

    p2_gender = parent2_features.get("gender", "Unknown")
    p2_age = parent2_features.get("age", "Unknown")
    p2_emotion = parent2_features.get("emotion", "Unknown")
    p2_smile = parent2_features.get("smile", 0)
    p2_beauty = parent2_features.get("beauty", 0)

    prompt = (
        f"Imagine a child whose parents have the following characteristics:\n"
        f"Parent 1 - Gender: {p1_gender}, Age: {p1_age}, Emotion: {p1_emotion}, "
        f"Smile: {p1_smile}, Beauty: {p1_beauty}\n"
        f"Parent 2 - Gender: {p2_gender}, Age: {p2_age}, Emotion: {p2_emotion}, "
        f"Smile: {p2_smile}, Beauty: {p2_beauty}\n"
        f"Generate a description of how the child would look, considering these features."
    )

    return prompt
