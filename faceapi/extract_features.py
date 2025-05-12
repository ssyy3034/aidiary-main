def extract_features(face_data):
    """
    얼굴 특징 추출 함수 (age, gender, emotion, hair_length 제외)
    """
    if not face_data or "face_detail_infos" not in face_data:
        print("[DEBUG] No 'face_detail_infos' key found in the response.")
        return {"error": "No face data found or analysis failed."}

    face_info_list = face_data.get("face_detail_infos", [])
    if not face_info_list:
        print("[DEBUG] 'face_detail_infos' is empty.")
        return {"error": "No face data found in the response."}

    face_info = face_info_list[0].get("face_detail_attributes_info", {})
    if not face_info:
        print("[DEBUG] 'face_detail_attributes_info' is missing.")
        return {"error": "No face attributes info found in the response."}

    def get_feature(data, path, default=None):
        keys = path.split(".")
        for key in keys:
            if not isinstance(data, dict) or key not in data:
                return default
            data = data[key]
        return data

    def map_eye_size(value):
        sizes = ["Small", "Normal", "Large"]
        return sizes[value] if isinstance(value, int) and 0 <= value < len(sizes) else "Not Detected"

    def map_nose_shape(value):
        shapes = ["Upturned", "Hooked", "Normal", "Round"]
        return shapes[value] if isinstance(value, int) and 0 <= value < len(shapes) else "Not Detected"

    def map_face_shape(value):
        shapes = ["Square", "Triangle", "Oval", "Heart", "Round"]
        return shapes[value] if isinstance(value, int) and 0 <= value < len(shapes) else "Not Detected"

    def map_skin_color(value):
        colors = ["Yellow", "Brown", "Black", "White"]
        return colors[value] if isinstance(value, int) and 0 <= value < len(colors) else "Not Detected"

    def map_hair_color(value):
        colors = ["Black", "Blonde", "Brown", "Grey/White"]
        return colors[value] if isinstance(value, int) and 0 <= value < len(colors) else "Not Detected"


    return {
        "eye_size": map_eye_size(get_feature(face_info, "eye.eye_size.type")),
        "nose_shape": map_nose_shape(get_feature(face_info, "nose.type")),
        "face_shape": map_face_shape(get_feature(face_info, "shape.type")),
        "hair_color": map_hair_color(get_feature(face_info, "hair.color.type")),
        "skin_color": map_skin_color(get_feature(face_info, "skin.type")),
        "smile": get_feature(face_info, "smile", 0),
        "head_pose": {
            "pitch": get_feature(face_info, "head_pose.pitch", 0),
            "yaw": get_feature(face_info, "head_pose.yaw", 0),
            "roll": get_feature(face_info, "head_pose.roll", 0)
        }
    }
