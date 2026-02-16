"""
prompt_generator.py - 유전적 특징 기반 상세 프롬프트 생성

generate_prompt(child_features): 블렌딩된 자녀 특징 → 이미지 생성 프롬프트
generate_fetal_prompt(): 일기 그림 프롬프트 (기존 유지)
"""


def generate_fetal_prompt(sentiment_data, scene_description):
    """
    감정 분석 결과와 LLM이 생성한 장면 묘사를 바탕으로
    '태아가 상상한 엄마의 하루' 스타일의 프롬프트를 생성합니다.
    """
    emotion = sentiment_data.get("label", "Happy")

    base_prompt = (
        "Child's crayon drawing, naive art style, cute and colorful. "
        "A scene depicting: {scene_description}. "
        "Atmosphere: {emotion}, warm lighting. "
        "On white paper, rough texture, scribbles. "
        "No text, no watermarks."
    )

    final_prompt = base_prompt.format(
        scene_description=scene_description,
        emotion=emotion
    )

    return final_prompt


def _describe_eye(child):
    """눈 특징 묘사 - 비율 수치 포함"""
    eye_ratio = child.get("eye_ratio", 0.3)
    double = child.get("double_eyelid", False)

    if eye_ratio > 0.38:
        size = "large and wide-open"
    elif eye_ratio > 0.32:
        size = "medium-sized, softly rounded"
    elif eye_ratio < 0.25:
        size = "narrow, elongated almond-shaped"
    else:
        size = "gently rounded"

    eyelid = "prominent double eyelids with visible crease" if double else "single eyelids (monolid)"
    return f"{size} eyes with {eyelid}"


def _describe_nose(child):
    """코 특징 묘사 - 너비/길이 비율 반영"""
    cat = child.get("nose_shape_category", "normal")
    nose_w = child.get("nose_width", 30.0)
    nose_l = child.get("nose_length", 40.0)
    bridge_h = child.get("nose_bridge_height", 30.0)

    # 코 길이 대비 너비 비율
    ratio = nose_w / (nose_l + 1e-6)

    if cat == "narrow":
        base = "a narrow, high-bridged nose"
    elif cat == "wide":
        base = "a broad, flat-bridged nose with wide nostrils"
    else:
        base = "a moderately defined nose"

    if bridge_h > 35:
        base += " with a prominent bridge"
    elif bridge_h < 20:
        base += " with a low, flat bridge"

    return base


def _describe_face_shape(child):
    """얼굴형 묘사 - 비율 수치 반영"""
    cat = child.get("face_shape_category", "oval")
    face_w = child.get("face_width", 150.0)
    face_h = child.get("face_height", 200.0)
    jaw_w = child.get("jaw_width", 120.0)

    shape_map = {
        "round": "a round face with full, chubby cheeks and a soft jawline",
        "oval": "an oval face with balanced proportions",
        "square": "a face with a defined, slightly angular jawline",
        "long": "an elongated face with a narrow chin",
    }
    base = shape_map.get(cat, "a soft baby face")

    # 턱 너비 비율로 보조 설명
    jaw_ratio = jaw_w / (face_w + 1e-6)
    if jaw_ratio > 0.85:
        base += ", wide jaw"
    elif jaw_ratio < 0.7:
        base += ", tapering to a pointed chin"

    return base


def _describe_skin(child):
    """피부색 묘사 - LAB L값 기반 세분화"""
    skin_lab = child.get("skin_lab", (150, 128, 128))
    l_val = skin_lab[0]
    a_val = skin_lab[1]  # 128 기준: 높으면 붉은끼, 낮으면 녹색끼
    b_val = skin_lab[2]  # 128 기준: 높으면 노란끼, 낮으면 푸른끼

    if l_val > 180:
        tone = "very fair, porcelain"
    elif l_val > 165:
        tone = "fair, light"
    elif l_val > 150:
        tone = "light with a warm undertone"
    elif l_val > 135:
        tone = "light-medium, naturally warm"
    elif l_val > 120:
        tone = "medium, golden-toned"
    else:
        tone = "warm olive-toned"

    # 붉은끼/노란끼 보조
    if a_val > 140:
        tone += " with rosy undertones"
    if b_val > 145:
        tone += " with warm yellow undertones"

    return f"{tone} skin"


def _describe_lips(child):
    """입술 묘사"""
    thickness = child.get("lip_thickness", 15.0)
    mouth_w = child.get("mouth_width", 50.0)

    if thickness > 22:
        t = "full, plump"
    elif thickness > 15:
        t = "medium-thick, softly curved"
    elif thickness < 10:
        t = "thin, delicate"
    else:
        t = "gently defined"

    if mouth_w > 55:
        return f"{t} lips with a wide mouth"
    elif mouth_w < 40:
        return f"{t} lips with a small, compact mouth"
    return f"{t} lips"


def _describe_extras(child):
    """보조개 등 추가 특징"""
    extras = []
    if child.get("dimple", False):
        extras.append("cute dimples on both cheeks")

    ipd = child.get("interpupillary", 60.0)
    face_w = child.get("face_width", 150.0)
    ipd_ratio = ipd / (face_w + 1e-6)
    if ipd_ratio > 0.42:
        extras.append("widely-spaced eyes")
    elif ipd_ratio < 0.35:
        extras.append("close-set eyes")

    return extras


def generate_prompt(child_features):
    """
    블렌딩된 자녀 특징(child_features)으로부터 이미지 생성 프롬프트 작성.
    각 묘사에 비율 수치가 반영되어 Gemini가 구체적 특징을 재현하도록 유도.
    """
    eye_desc = _describe_eye(child_features)
    nose_desc = _describe_nose(child_features)
    face_desc = _describe_face_shape(child_features)
    skin_desc = _describe_skin(child_features)
    lip_desc = _describe_lips(child_features)
    extras = _describe_extras(child_features)

    feature_parts = [eye_desc, nose_desc, face_desc, skin_desc, lip_desc]
    feature_parts.extend(extras)
    feature_text = ". ".join(feature_parts)

    prompt = (
        f"Professional studio photograph of an adorable Korean baby (1-2 years old), "
        f"front-facing portrait. "
        f"CRITICAL facial features to match exactly: {feature_text}. "
        f"Natural soft studio lighting, shallow depth of field, "
        f"gentle happy expression, looking directly at camera. "
        f"High resolution, sharp focus on face, clean background. "
        f"No text, no watermarks, no artifacts, no extra people."
    )

    return prompt
