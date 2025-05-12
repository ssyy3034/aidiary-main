import os
import requests
from PIL import Image

API_URL = "https://www.ailabapi.com/api/portrait/analysis/face-analyzer"
API_KEY = "2en9VSKfYomuuGLUa6I7DOKFpANWURzOg8pbLISJsvvxZkAFqXsCPEyWEiBtwQlt"
MAX_SIZE = (2000, 2000)

def resize_image(image_path):
    """
    이미지 크기를 2000x2000 이하로 조정
    """
    try:
        with Image.open(image_path) as img:
            if img.width > MAX_SIZE[0] or img.height > MAX_SIZE[1]:
                print(f"[INFO] Resizing image {image_path} to {MAX_SIZE}")
                img.thumbnail(MAX_SIZE)
                img.save(image_path)
                print(f"[INFO] Image resized and saved as {image_path}")
            return image_path
    except Exception as e:
        print(f"[ERROR] Image resizing failed: {e}")
        return None

def analyze_face(image_path):
    """
    AILabTools API를 호출하여 얼굴 분석을 수행
    """
    headers = {
        "ailabapi-api-key": API_KEY
    }

    if not os.path.exists(image_path):
        return {"error": "File not found"}

    file_size = os.path.getsize(image_path)
    if file_size == 0:
        return {"error": "File is empty"}

    # 이미지 리사이즈
    image_path = resize_image(image_path)
    if not image_path:
        return {"error": "Image processing failed"}

    # 요청할 속성만 남김
    data = {
        "max_face_num": 1,
        "need_rotate_detection": 1,
        "face_attributes_type": "Eye,Nose,Shape,Hair,Skin"
    }

    try:
        with open(image_path, "rb") as img_file:
            files = {"image": img_file}
            response = requests.post(API_URL, headers=headers, files=files, data=data)

        # 전체 응답을 출력
        print("\n--- FULL RESPONSE START ---")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Content: {response.content.decode('utf-8')}")
        print("--- FULL RESPONSE END ---\n")

        # 응답이 JSON 형식이 아닐 경우를 대비한 예외 처리
        try:
            data = response.json()
        except ValueError as e:
            print(f"[ERROR] JSON Decode Error: {e}")
            return {"error": "Invalid JSON response"}

        # 얼굴 데이터가 없는 경우
        face_info_list = data.get("face_detail_infos", [])
        if not face_info_list:
            print("[DEBUG] No face data detected in the image.")
            print("[DEBUG] Full Response Data:", data)
            return {"error": "No face data found or analysis failed."}

        return data

    except requests.RequestException as req_err:
        print(f"[ERROR] Request error: {req_err}")
        return {"error": str(req_err)}
    except Exception as err:
        print(f"[ERROR] Unexpected error: {err}")
        return {"error": str(err)}
