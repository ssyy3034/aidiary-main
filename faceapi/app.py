from flask import Flask, request, jsonify
import os

from extract_features import extract_features
from face_analyzer import analyze_face

app = Flask(__name__)
UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def save_file(file, filename):
    """ 파일 저장 함수 """
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    print(f"[INFO] File saved: {file_path} (Size: {os.path.getsize(file_path)} bytes)")
    return file_path

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # 요청 정보 출력
        print(f"[INFO] Request Content-Type: {request.content_type}")
        print(f"[INFO] Request Files: {request.files}")
        print(f"[INFO] Request Form Data: {request.form}")

        # 파일 필드명 확인
        print(f"[INFO] parent1 in request.files: {'parent1' in request.files}")
        print(f"[INFO] parent2 in request.files: {'parent2' in request.files}")

        # 파일 체크
        if 'parent1' not in request.files or 'parent2' not in request.files:
            print("[ERROR] Missing files in the request")
            return jsonify({"error": "Both parent1 and parent2 images are required"}), 400

        parent1 = request.files['parent1']
        parent2 = request.files['parent2']

        print(f"[INFO] parent1 filename: {parent1.filename}")
        print(f"[INFO] parent2 filename: {parent2.filename}")

        # 파일명 유효성 검사
        if parent1.filename == '' or parent2.filename == '':
            print("[ERROR] One or both files are missing")
            return jsonify({"error": "File is missing"}), 422

        # 파일 저장
        parent1_path = save_file(parent1, "parent1.jpg")
        parent2_path = save_file(parent2, "parent2.jpg")

        # 부모 이미지 분석
        parent1_data = analyze_face(parent1_path)
        parent2_data = analyze_face(parent2_path)

        # 에러 처리
        if "error" in parent1_data:
            print(f"[ERROR] Parent1 Analysis Error: {parent1_data}")
            return jsonify({"error": parent1_data["error"]}), 422
        if "error" in parent2_data:
            print(f"[ERROR] Parent2 Analysis Error: {parent2_data}")
            return jsonify({"error": parent2_data["error"]}), 422

        # 필요한 속성만 추출
        parent1_features = extract_features(parent1_data)
        parent2_features = extract_features(parent2_data)

        return jsonify({
            "parent1_features": parent1_features,
            "parent2_features": parent2_features
        })

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
