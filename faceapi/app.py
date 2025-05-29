from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from extract_features import extract_features
from face_analyzer import analyze_face
from hugging_face_service import HuggingFaceService
from image_generator import ImageGenerator  # ImageGenerator 클래스 import
from dotenv import load_dotenv  # 추가

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 인스턴스 생성
hugging_face_service = HuggingFaceService()
image_generator = ImageGenerator()  # ImageGenerator 인스턴스 생성


def save_file(file, filename):
    """ 파일 저장 함수 """
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    print(f"[INFO] File saved: {file_path} (Size: {os.path.getsize(file_path)} bytes)")
    return file_path


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        parent1 = request.files.get('parent1')
        parent2 = request.files.get('parent2')

        if not parent1 or not parent2:
            return jsonify({"error": "Both parent1 and parent2 images are required"}), 400

        # 파일 저장
        parent1_path = save_file(parent1, "parent1.jpg")
        parent2_path = save_file(parent2, "parent2.jpg")

        # 부모 이미지 분석
        parent1_data = analyze_face(parent1_path)
        parent2_data = analyze_face(parent2_path)

        # 에러 처리
        if "error" in parent1_data:
            return jsonify({"error": parent1_data["error"]}), 422
        if "error" in parent2_data:
            return jsonify({"error": parent2_data["error"]}), 422

        # 필요한 속성만 추출
        parent1_features = extract_features(parent1_data)
        parent2_features = extract_features(parent2_data)

        # 이미지 생성
        result = image_generator.process_image_generation(parent1_features, parent2_features)

        if not result["success"]:
            return jsonify({"error": result["error"]}), 500

        # 생성된 이미지 파일 전송
        return send_file(
            result["image_path"],
            mimetype='image/png',
            as_attachment=True,
            download_name='generated_child.png'
        )

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)