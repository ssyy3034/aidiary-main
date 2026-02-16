"""
face_analyzer.py - MediaPipe Face Mesh 기반 로컬 얼굴 분석

AILabTools 외부 API 의존을 제거하고 MediaPipe Face Mesh로 교체.
478개 랜드마크 + 얼굴 메트릭 + 피부색(LAB) 추출.
"""

import os
import cv2
import numpy as np
import mediapipe as mp
import logging

logger = logging.getLogger(__name__)

# MediaPipe Face Mesh 초기화 (싱글턴)
_face_mesh = None


def _get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        _face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,  # 478개 랜드마크 (눈 주변 상세)
            min_detection_confidence=0.5,
        )
    return _face_mesh


# === MediaPipe Face Mesh 주요 랜드마크 인덱스 ===
# 참고: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
LANDMARKS = {
    # 눈
    "left_eye_inner": 133,
    "left_eye_outer": 33,
    "left_eye_top": 159,
    "left_eye_bottom": 145,
    "right_eye_inner": 362,
    "right_eye_outer": 263,
    "right_eye_top": 386,
    "right_eye_bottom": 374,
    # 눈썹
    "left_eyebrow_inner": 107,
    "left_eyebrow_outer": 67,
    "right_eyebrow_inner": 336,
    "right_eyebrow_outer": 297,
    # 코
    "nose_tip": 1,
    "nose_bridge_top": 6,
    "nose_left": 129,
    "nose_right": 358,
    "nose_bottom": 2,
    # 입
    "mouth_left": 61,
    "mouth_right": 291,
    "upper_lip_top": 13,
    "lower_lip_bottom": 14,
    # 얼굴 윤곽
    "chin": 152,
    "forehead_top": 10,
    "left_cheek": 234,
    "right_cheek": 454,
    "left_jaw": 172,
    "right_jaw": 397,
}

# 모핑에 사용할 핵심 랜드마크 인덱스 (68점 호환 세트)
MORPH_LANDMARK_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
    # 눈썹
    107, 66, 105, 63, 70, 336, 296, 334, 293, 300,
    # 눈
    33, 160, 158, 133, 153, 144, 362, 385, 387, 263, 373, 380,
    # 코
    1, 2, 98, 327, 129, 358,
    # 입
    61, 39, 37, 0, 267, 269, 291, 405, 314, 17, 84, 181,
]


def analyze_face(image_path):
    """
    MediaPipe Face Mesh로 얼굴 분석 수행

    Returns:
        dict: {
            "landmarks_478": [(x, y, z), ...],  # 전체 478 랜드마크 (정규화 좌표)
            "landmarks_morph": [(x_px, y_px), ...],  # 모핑용 핵심 랜드마크 (픽셀)
            "metrics": { ... },  # 얼굴 메트릭 (비율)
            "skin_lab": (L, A, B),  # 피부색 LAB
            "image_shape": (h, w, c),
        }
        또는 {"error": "..."} 에러 시
    """
    if not os.path.exists(image_path):
        return {"error": "File not found"}

    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return {"error": "Failed to read image"}

    h, w, _ = img_bgr.shape
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    face_mesh = _get_face_mesh()
    results = face_mesh.process(img_rgb)

    if not results.multi_face_landmarks:
        return {"error": "No face detected"}

    face_lms = results.multi_face_landmarks[0]

    # === 전체 478 랜드마크 (정규화 좌표) ===
    landmarks_478 = [
        (lm.x, lm.y, lm.z) for lm in face_lms.landmark
    ]

    # === 모핑용 핵심 랜드마크 (픽셀 좌표) ===
    landmarks_morph = []
    for idx in MORPH_LANDMARK_INDICES:
        if idx < len(face_lms.landmark):
            lm = face_lms.landmark[idx]
            landmarks_morph.append((lm.x * w, lm.y * h))

    # === 얼굴 메트릭 계산 ===
    def px(idx):
        lm = face_lms.landmark[idx]
        return np.array([lm.x * w, lm.y * h])

    metrics = _compute_metrics(px)

    # === 피부색 추출 (LAB) ===
    skin_lab = _extract_skin_color(img_bgr, face_lms, w, h)

    logger.info(f"얼굴 분석 완료: {len(landmarks_478)} 랜드마크, 피부 LAB={skin_lab}")

    return {
        "landmarks_478": landmarks_478,
        "landmarks_morph": landmarks_morph,
        "metrics": metrics,
        "skin_lab": skin_lab,
        "image_shape": (h, w, 3),
    }


def _compute_metrics(px):
    """랜드마크 좌표로부터 얼굴 메트릭(비율) 계산"""

    # 양안 거리
    left_eye_center = (px(LANDMARKS["left_eye_inner"]) + px(LANDMARKS["left_eye_outer"])) / 2
    right_eye_center = (px(LANDMARKS["right_eye_inner"]) + px(LANDMARKS["right_eye_outer"])) / 2
    interpupillary = np.linalg.norm(right_eye_center - left_eye_center)

    # 얼굴 높이/너비
    chin = px(LANDMARKS["chin"])
    forehead = px(LANDMARKS["forehead_top"])
    face_height = np.linalg.norm(chin - forehead)
    left_cheek = px(LANDMARKS["left_cheek"])
    right_cheek = px(LANDMARKS["right_cheek"])
    face_width = np.linalg.norm(right_cheek - left_cheek)

    # 코
    nose_tip = px(LANDMARKS["nose_tip"])
    nose_bridge = px(LANDMARKS["nose_bridge_top"])
    nose_left = px(LANDMARKS["nose_left"])
    nose_right = px(LANDMARKS["nose_right"])
    nose_length = np.linalg.norm(nose_tip - nose_bridge)
    nose_width = np.linalg.norm(nose_right - nose_left)
    nose_bridge_height = abs(nose_bridge[1] - nose_tip[1])

    # 눈 크기 (좌우 평균)
    left_eye_h = np.linalg.norm(px(LANDMARKS["left_eye_top"]) - px(LANDMARKS["left_eye_bottom"]))
    left_eye_w = np.linalg.norm(px(LANDMARKS["left_eye_outer"]) - px(LANDMARKS["left_eye_inner"]))
    right_eye_h = np.linalg.norm(px(LANDMARKS["right_eye_top"]) - px(LANDMARKS["right_eye_bottom"]))
    right_eye_w = np.linalg.norm(px(LANDMARKS["right_eye_outer"]) - px(LANDMARKS["right_eye_inner"]))
    eye_ratio = ((left_eye_h / (left_eye_w + 1e-6)) + (right_eye_h / (right_eye_w + 1e-6))) / 2
    eye_height = (left_eye_h + right_eye_h) / 2

    # 입
    mouth_left = px(LANDMARKS["mouth_left"])
    mouth_right = px(LANDMARKS["mouth_right"])
    upper_lip = px(LANDMARKS["upper_lip_top"])
    lower_lip = px(LANDMARKS["lower_lip_bottom"])
    mouth_width = np.linalg.norm(mouth_right - mouth_left)
    lip_thickness = np.linalg.norm(lower_lip - upper_lip)

    # 하악 너비
    jaw_width = np.linalg.norm(px(LANDMARKS["right_jaw"]) - px(LANDMARKS["left_jaw"]))

    # 쌍꺼풀 감지 (눈 높이/폭 비율 기반 휴리스틱)
    # 비율이 높으면 쌍꺼풀 있을 가능성 높음
    left_brow_eye_dist = np.linalg.norm(
        px(LANDMARKS["left_eyebrow_inner"]) - px(LANDMARKS["left_eye_top"])
    )
    right_brow_eye_dist = np.linalg.norm(
        px(LANDMARKS["right_eyebrow_inner"]) - px(LANDMARKS["right_eye_top"])
    )
    avg_brow_eye_dist = (left_brow_eye_dist + right_brow_eye_dist) / 2
    double_eyelid = avg_brow_eye_dist > (eye_height * 1.8)

    return {
        "interpupillary": float(interpupillary),
        "face_height": float(face_height),
        "face_width": float(face_width),
        "face_ratio": float(face_width / (face_height + 1e-6)),
        "nose_length": float(nose_length),
        "nose_width": float(nose_width),
        "nose_bridge_height": float(nose_bridge_height),
        "eye_ratio": float(eye_ratio),
        "eye_height": float(eye_height),
        "mouth_width": float(mouth_width),
        "lip_thickness": float(lip_thickness),
        "jaw_width": float(jaw_width),
        "double_eyelid": bool(double_eyelid),
    }


def _extract_skin_color(img_bgr, face_landmarks, w, h):
    """
    얼굴 영역에서 피부색 추출 (LAB 색공간)
    볼 영역 중앙부 샘플링하여 안정적인 피부색 획득
    """
    try:
        # 양쪽 볼 중앙 영역 샘플링
        cheek_indices = [
            (50, 101, 118, 117),   # 왼쪽 볼
            (280, 330, 347, 346),  # 오른쪽 볼
        ]

        lab_values = []
        img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

        for indices in cheek_indices:
            pts = []
            for idx in indices:
                if idx < len(face_landmarks.landmark):
                    lm = face_landmarks.landmark[idx]
                    pts.append((int(lm.x * w), int(lm.y * h)))

            if len(pts) == 4:
                cx = int(np.mean([p[0] for p in pts]))
                cy = int(np.mean([p[1] for p in pts]))
                # 5x5 영역 평균
                region = img_lab[
                    max(0, cy-2):min(h, cy+3),
                    max(0, cx-2):min(w, cx+3)
                ]
                if region.size > 0:
                    lab_values.append(region.mean(axis=(0, 1)))

        if lab_values:
            avg_lab = np.mean(lab_values, axis=0)
            return tuple(float(v) for v in avg_lab)

        return (150.0, 128.0, 128.0)  # 기본값

    except Exception as e:
        logger.warning(f"피부색 추출 실패: {e}")
        return (150.0, 128.0, 128.0)
