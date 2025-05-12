def generate_prompt(parent1_features, parent2_features):
    """
    부모의 얼굴 특징을 기반으로 GPT에 전달할 프롬프트 생성

    Args:
        parent1_features (dict): 부모 1의 얼굴 특징
        parent2_features (dict): 부모 2의 얼굴 특징

    Returns:
        str: 생성된 GPT 프롬프트
    """

    def extract_characteristics(features, label):
        """특징 문자열 생성 함수"""
        return (
            f"{label} - "
            f"Skin Color: {features.get('skin_color')}, "
            f"Face Shape: {features.get('face_shape')}, "
            f"Eye Size: {features.get('eye_size')}, "
            f"Eyelid Type: {features.get('eyelid_type')}, "
            f"Nose Shape: {features.get('nose_shape')}, "
            f"Hair Color: {features.get('hair_color')}"
        )

    # 부모 특징 구성
    parent1_desc = extract_characteristics(parent1_features, "Parent 1")
    parent2_desc = extract_characteristics(parent2_features, "Parent 2")

    # 프롬프트 생성
    prompt = (
        f"Generate a description of a child based on the following parental characteristics:\n\n"
        f"{parent1_desc}\n\n"
        f"{parent2_desc}\n\n"
        f"Based on these characteristics, describe the likely appearance of the child."
    )

    return prompt
