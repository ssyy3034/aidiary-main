import requests
import json

# API 엔드포인트
url = "https://www.ailabapi.com/api/portrait/analysis/face-analyzer"

# 발급받은 API 키
API_KEY = "YOUR_API_KEY"  # 발급받은 API 키로 대체

def analyze_face(image_path):
    headers = {
        "ailabapi-api-key": API_KEY
    }

    files = {
        "file": open(image_path, "rb")
    }

    try:
        response = requests.post(url, headers=headers, files=files)
        response.raise_for_status()
        data = response.json()

        # API 응답 출력
        print(json.dumps(data, indent=4))

        # 필요한 정보만 추출
        if "face_detail_infos" in data and data["face_detail_infos"]:
            face_info = data["face_detail_infos"][0]["face_detail_attributes_info"]
            return {
                "age": face_info["age"],
                "beauty": face_info["beauty"],
                "gender": "Male" if face_info["gender"]["type"] == 0 else "Female",
                "emotion": face_info["emotion"]["type"],
                "emotion_probability": face_info["emotion"]["probability"]
            }
        else:
            print("얼굴 정보가 인식되지 않았습니다.")
            return None

    except requests.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
    except Exception as err:
        print(f"Other error occurred: {err}")


# 테스트 실행
if __name__ == "__main__":
    parent1_info = analyze_face("parent1.jpg")
    parent2_info = analyze_face("parent2.jpg")

    print("\nParent 1 Analysis:", parent1_info)
    print("\nParent 2 Analysis:", parent2_info)
