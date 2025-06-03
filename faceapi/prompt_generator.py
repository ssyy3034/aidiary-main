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
        "Create a photorealistic portrait of an adorable child face:\n\n"
        f"{extract_characteristics(parent1_features, 'Parent 1')}\n\n"
        f"{extract_characteristics(parent2_features, 'Parent 2')}\n\n"
        "Technical requirements:\n"
        "1. Alpha channel background (100% transparent)\n"
        "2. Head and face only, front view\n"
        "3. Warm, natural smile\n"
        "4. Photo-realistic skin texture\n"
        "5. Natural lighting on face\n\n"
        "Generate image without text, labels, or descriptions. Output face only with transparent background."
    )

    return prompt