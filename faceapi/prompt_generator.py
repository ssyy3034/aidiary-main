def generate_prompt(parent1_features, parent2_features):
    """
    부모의 얼굴 특징을 기반으로 프롬프트 생성
    """

    def extract_characteristics(features, label):
        # 특징들의 가중치 정의
        feature_weights = {
            'skin_color': 0.8,  # 피부색은 유전적 영향이 큼
            'face_shape': 0.7,
            'eye_size': 0.6,
            'eyelid_type': 0.7,  # 쌍꺼풀 등은 유전적 특징이 강함
            'nose_shape': 0.6,
            'hair_color': 0.8  # 머리색도 유전적 영향이 큼
        }

        characteristics = []
        for feature, weight in feature_weights.items():
            if features.get(feature):
                characteristics.append(
                    f"{feature.replace('_', ' ').title()}: {features[feature]} (Genetic influence: {weight * 100}%)"
                )

        return f"{label}:\n" + "\n".join(characteristics)

    prompt = (
        "Generate a centered, photorealistic portrait of an adorable child, showing only the head and face.\n\n"
        "Visual style and facial features should subtly reflect:\n"
        f"{extract_characteristics(parent1_features, 'Parent 1')}\n"
        f"{extract_characteristics(parent2_features, 'Parent 2')}\n\n"
        "Strict technical constraints:\n"
        "1. Fully transparent background (alpha channel)\n"
        "2. Face and head only, centered and front-facing\n"
        "3. No body, text, objects, background elements, or clothing\n"
        "4. Cute and warm expression with natural smile\n"
        "5. Smooth, soft lighting with realistic skin tone and texture\n\n"
        "Important:\n"
        "- Do not include any text, watermark, symbols, or accessories\n"
        "- Emphasize the child's face as the sole visual focus\n"
        "- Keep the image clean, minimal, and suitable for avatar use"
    )


    return prompt