"""
feature_extractor.py - MediaPipe 랜드마크 기반 유전적 특징 구조화

face_analyzer.py의 출력(메트릭 + 랜드마크 + 피부색)을
genetic_blender.py가 소비하는 구조화된 특징 dict로 변환.
"""

import logging

logger = logging.getLogger(__name__)


def _classify_face_shape(metrics):
    """얼굴형 분류 (메트릭 기반)"""
    ratio = metrics.get("face_ratio", 0.75)
    if ratio > 0.85:
        return "round"
    elif ratio > 0.78:
        return "square"
    elif ratio > 0.72:
        return "oval"
    else:
        return "long"


def _classify_nose_shape(metrics):
    """코 형태 분류"""
    nose_w = metrics.get("nose_width", 0)
    face_w = metrics.get("face_width", 1)
    nose_ratio = nose_w / (face_w + 1e-6)

    if nose_ratio < 0.18:
        return "narrow"
    elif nose_ratio > 0.25:
        return "wide"
    else:
        return "normal"


def _classify_eye_size(metrics):
    """눈 크기 분류"""
    eye_r = metrics.get("eye_ratio", 0.3)
    if eye_r > 0.38:
        return "large"
    elif eye_r < 0.25:
        return "small"
    else:
        return "normal"


def _lab_to_skin_description(skin_lab):
    """LAB 피부색을 자연어 설명으로 변환"""
    l, a, b = skin_lab
    if l > 180:
        return "fair"
    elif l > 150:
        return "light"
    elif l > 120:
        return "medium"
    else:
        return "tan"


def extract_features(face_data):
    """
    face_analyzer.py의 출력을 genetic_blender가 소비하는 구조로 변환

    Args:
        face_data: face_analyzer.analyze_face()의 반환값

    Returns:
        dict: {
            # 다인자 유전 형질 (연속값)
            "eye_ratio": float,
            "eye_height": float,
            "nose_width": float,
            "nose_length": float,
            "nose_bridge_height": float,
            "face_width": float,
            "face_height": float,
            "jaw_width": float,
            "lip_thickness": float,
            "interpupillary": float,
            "mouth_width": float,
            # 멘델 유전 형질 (bool)
            "double_eyelid": bool,
            "dimple": bool,
            # 분류 형질
            "face_shape_category": str,
            "nose_shape_category": str,
            "eye_size_category": str,
            "skin_description": str,
            # 피부색 LAB
            "skin_lab": tuple,
            # 모핑용 랜드마크
            "landmarks": list,
        }
        또는 {"error": "..."} 에러 시
    """
    if not face_data or "error" in face_data:
        error_msg = face_data.get("error", "No face data") if face_data else "No face data"
        logger.warning(f"특징 추출 실패: {error_msg}")
        return {"error": error_msg}

    metrics = face_data.get("metrics", {})
    skin_lab = face_data.get("skin_lab", (150.0, 128.0, 128.0))
    landmarks_morph = face_data.get("landmarks_morph", [])

    features = {
        # 다인자 유전 형질 (연속값) - genetic_blender에서 h² 기반 블렌딩
        "eye_ratio": metrics.get("eye_ratio", 0.3),
        "eye_height": metrics.get("eye_height", 10.0),
        "nose_width": metrics.get("nose_width", 30.0),
        "nose_length": metrics.get("nose_length", 40.0),
        "nose_bridge_height": metrics.get("nose_bridge_height", 30.0),
        "face_width": metrics.get("face_width", 150.0),
        "face_height": metrics.get("face_height", 200.0),
        "jaw_width": metrics.get("jaw_width", 120.0),
        "lip_thickness": metrics.get("lip_thickness", 15.0),
        "interpupillary": metrics.get("interpupillary", 60.0),
        "mouth_width": metrics.get("mouth_width", 50.0),

        # 멘델 유전 형질 (bool)
        "double_eyelid": metrics.get("double_eyelid", False),
        "dimple": False,  # MediaPipe로는 직접 감지 어려움, 기본값

        # 분류 형질
        "face_shape_category": _classify_face_shape(metrics),
        "nose_shape_category": _classify_nose_shape(metrics),
        "eye_size_category": _classify_eye_size(metrics),
        "skin_description": _lab_to_skin_description(skin_lab),

        # 피부색 LAB (블렌딩용)
        "skin_lab": skin_lab,

        # 모핑용 랜드마크 (픽셀 좌표)
        "landmarks": landmarks_morph,
    }

    logger.info(
        f"특징 추출 완료: 얼굴형={features['face_shape_category']}, "
        f"코={features['nose_shape_category']}, 눈={features['eye_size_category']}, "
        f"쌍꺼풀={features['double_eyelid']}"
    )

    return features
