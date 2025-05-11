from flask import Flask, request, jsonify
import os
from face_analyzer import analyze_face
from extract_features import extract_features

app = Flask(__name__)
UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # 파일 체크
        if 'parent1' not in request.files or 'parent2' not in request.files:
            return jsonify({"error": "Both parent1 and parent2 images are required"}), 400

        parent1 = request.files['parent1']
        parent2 = request.files['parent2']

        parent1_path = os.path.join(UPLOAD_FOLDER, "parent1.jpg")
        parent2_path = os.path.join(UPLOAD_FOLDER, "parent2.jpg")

        # 파일 저장
        parent1.save(parent1_path)
        parent2.save(parent2_path)

        # 부모 이미지 분석
        parent1_data = analyze_face(parent1_path)
        parent2_data = analyze_face(parent2_path)

        # 얼굴 특징 추출
        parent1_features = extract_features(parent1_data)
        parent2_features = extract_features(parent2_data)

        return jsonify({
            "parent1_features": parent1_features,
            "parent2_features": parent2_features
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
