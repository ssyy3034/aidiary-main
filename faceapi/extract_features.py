def extract_features(face_data):
    """
    AILabTools API 응답에서 주요 특징을 추출하는 함수

    Parameters:
        face_data (dict): AILabTools API에서 반환된 얼굴 분석 데이터

    Returns:
        dict: 추출된 얼굴 특징 정보
    """
    if "face_detail_infos" in face_data and face_data["face_detail_infos"]:
        face_info = face_data["face_detail_infos"][0]["face_detail_attributes_info"]

        return {
            "age": face_info.get("age", 0),
            "beauty": face_info.get("beauty", 0),
            "gender": "Male" if face_info["gender"]["type"] == 0 else "Female",
            "emotion": face_info["emotion"]["type"],
            "emotion_probability": face_info["emotion"]["probability"],
            "smile": face_info.get("smile", 0)
        }

    return {
        "error": "No face data found or analysis failed."
    }
