"""
genetic_blender.py - gen.md 유전도(h²) 기반 부모 특징 블렌딩 엔진

다인자 유전: child = λ*p1 + (1-λ)*p2 + noise, noise scale = (1-h²)
멘델 유전: 확률 기반 on/off (쌍꺼풀, 보조개 등)
피부색: LAB 색공간 중간값 블렌딩
"""

import random
import numpy as np

# === 유전도 계수 (h²) - gen.md 연구 데이터 기반 ===
H2 = {
    "eye_ratio": 0.4487,       # 쌍꺼풀/눈 크기 (26,806명 중국인 GWAS)
    "nose_shape": 0.668,       # 코 형태 (한국인 117가구 데이터)
    "face_shape": 0.70,        # 얼굴형 (TwinsUK 84.8% 상한)
    "lip_thickness": 0.60,     # 입술 두께
    "skin_color": 0.80,        # 피부색 (다인자, 높은 유전도)
    "interpupillary": 0.75,    # 양안 거리
    "face_width": 0.72,        # 얼굴 너비 (수평 치수가 더 강하게 유전)
    "nose_width": 0.668,       # 콧방울 너비
    "nose_length": 0.65,       # 코 길이
    "eyebrow_shape": 0.433,    # 눈썹 형태
    "jaw_width": 0.55,         # 하악 너비 (환경 요인 존재)
}

# === 멘델 유전 형질 확률표 ===
MENDELIAN_TRAITS = {
    "double_eyelid": {
        "both_dominant": 0.62,    # 부모 모두 쌍꺼풀 → 62%
        "one_dominant": 0.43,     # 한 명만 → 43%
        "both_recessive": 0.05,   # 둘 다 없음 → 매우 낮음
    },
    "dimple": {
        "both_dominant": 0.90,
        "one_dominant": 0.75,     # 이형접합 부모 시 75%
        "both_recessive": 0.02,
    },
    "cleft_chin": {
        "both_dominant": 0.85,
        "one_dominant": 0.50,
        "both_recessive": 0.02,
    },
    "widows_peak": {
        "both_dominant": 0.80,
        "one_dominant": 0.50,
        "both_recessive": 0.05,
    },
}


def blend_polygenic(p1_value, p2_value, trait_key):
    """
    다인자 유전 블렌딩 (KIN-MIX 방식)
    child = λ*p1 + (1-λ)*p2 + noise
    λ: 0.5 중심 가우시안 (σ=0.1)
    noise: (1-h²) * scale
    """
    h2 = H2.get(trait_key, 0.5)

    # λ: 부모 편향 (0.5 중심, 약간의 변이)
    lam = np.clip(random.gauss(0.5, 0.1), 0.15, 0.85)

    # 기본 블렌딩
    child_value = lam * p1_value + (1 - lam) * p2_value

    # 환경/비유전 노이즈: 유전도 낮으면 노이즈 큼
    noise_scale = (1 - h2) * 0.15 * abs(p1_value + p2_value + 1e-6) / 2
    noise = random.gauss(0, noise_scale)
    child_value += noise

    return child_value


def blend_skin_color_lab(p1_lab, p2_lab):
    """
    LAB 색공간에서 부모 피부색 블렌딩
    L: 밝기, A: 녹-빨, B: 파-노
    피부색 h²=0.80이므로 부모 중간값에 가까움
    """
    h2 = H2["skin_color"]
    lam = np.clip(random.gauss(0.5, 0.08), 0.2, 0.8)

    child_lab = []
    for i in range(3):
        base = lam * p1_lab[i] + (1 - lam) * p2_lab[i]
        noise = random.gauss(0, (1 - h2) * 3.0)
        child_lab.append(base + noise)

    return tuple(child_lab)


def resolve_mendelian(trait_name, p1_has, p2_has):
    """
    멘델 유전 형질 확률 결정
    Returns: bool (자녀에게 형질 발현 여부)
    """
    probs = MENDELIAN_TRAITS.get(trait_name)
    if probs is None:
        return random.random() < 0.5

    if p1_has and p2_has:
        prob = probs["both_dominant"]
    elif p1_has or p2_has:
        prob = probs["one_dominant"]
    else:
        prob = probs["both_recessive"]

    return random.random() < prob


def blend_features(p1_features, p2_features):
    """
    부모 두 명의 구조화된 특징을 유전학 기반으로 블렌딩
    Returns: child_features dict
    """
    child = {}

    # === 다인자 유전 형질 (연속값) ===
    polygenic_keys = [
        "eye_ratio", "nose_width", "nose_length", "nose_bridge_height",
        "face_width", "face_height", "jaw_width", "lip_thickness",
        "interpupillary", "eye_height", "mouth_width",
    ]
    for key in polygenic_keys:
        p1_val = p1_features.get(key, 0.0)
        p2_val = p2_features.get(key, 0.0)
        # trait_key 매핑 (H2에 없으면 기본 0.5)
        trait_key = key
        child[key] = blend_polygenic(p1_val, p2_val, trait_key)

    # === 피부색 (LAB 블렌딩) ===
    p1_skin = p1_features.get("skin_lab", (150, 128, 128))
    p2_skin = p2_features.get("skin_lab", (150, 128, 128))
    child["skin_lab"] = blend_skin_color_lab(p1_skin, p2_skin)

    # === 멘델 유전 형질 (on/off) ===
    child["double_eyelid"] = resolve_mendelian(
        "double_eyelid",
        p1_features.get("double_eyelid", False),
        p2_features.get("double_eyelid", False),
    )
    child["dimple"] = resolve_mendelian(
        "dimple",
        p1_features.get("dimple", False),
        p2_features.get("dimple", False),
    )

    # === 얼굴형 분류 (부모 중 하나를 확률적으로 선택 + 블렌딩) ===
    child["face_shape_category"] = random.choice([
        p1_features.get("face_shape_category", "oval"),
        p2_features.get("face_shape_category", "oval"),
    ])

    # === 코 형태 분류 ===
    # 좁은 코가 부분적 우성 (gen.md)
    p1_nose = p1_features.get("nose_shape_category", "normal")
    p2_nose = p2_features.get("nose_shape_category", "normal")
    if "narrow" in (p1_nose, p2_nose):
        child["nose_shape_category"] = "narrow" if random.random() < 0.65 else "normal"
    else:
        child["nose_shape_category"] = random.choice([p1_nose, p2_nose])

    # === 랜드마크 블렌딩 (모핑용) ===
    p1_landmarks = p1_features.get("landmarks", [])
    p2_landmarks = p2_features.get("landmarks", [])
    if p1_landmarks and p2_landmarks and len(p1_landmarks) == len(p2_landmarks):
        lam = np.clip(random.gauss(0.5, 0.08), 0.3, 0.7)
        child["landmarks"] = [
            (lam * p1[0] + (1 - lam) * p2[0], lam * p1[1] + (1 - lam) * p2[1])
            for p1, p2 in zip(p1_landmarks, p2_landmarks)
        ]

    return child
