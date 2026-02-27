import base64
import numpy as np
import cv2
from flask import Blueprint, request, jsonify, send_file
from services.image_generator import ImageGenerator
from utils.file_utils import save_file

analysis_bp = Blueprint('analysis', __name__)
image_generator = ImageGenerator()

@analysis_bp.route('/api/diary-drawing', methods=['POST'])
def generate_diary_drawing():
    """일기 텍스트를 분석하여 '태아가 그린 그림일기'를 생성"""
    try:
        data = request.get_json()
        diary_text = data.get("diary_text", "")

        if not diary_text or len(diary_text.strip()) == 0:
            return jsonify({"error": "diary_text is required"}), 400

        result = image_generator.generate_diary_drawing(diary_text)

        if not result["success"]:
            return jsonify({"error": result["error"]}), 500

        return jsonify(result)

    except Exception as e:
        print(f"[ERROR] Diary drawing generation failed: {e}")
        return jsonify({"error": str(e)}), 500

@analysis_bp.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    """일기 텍스트의 감정/키워드만 분석 (테스트용)"""
    try:
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "text is required"}), 400

        sentiment = image_generator.sentiment_analyzer.analyze(text)
        keywords = image_generator.keyword_extractor.extract_keywords(text)

        from services.prompt_generator import generate_fetal_prompt
        prompt = generate_fetal_prompt(sentiment, keywords)

        return jsonify({
            "sentiment": sentiment,
            "keywords": keywords,
            "generated_prompt": prompt
        })

    except Exception as e:
        print(f"[ERROR] Text analysis failed: {e}")
        return jsonify({"error": str(e)}), 500

@analysis_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    부모 이미지 2장 → 유전학 기반 아이 얼굴 예측 파이프라인

    전체 흐름을 image_generator.process_image_generation()에 위임.
    라우트는 파일 저장 + 에러 처리만 담당.
    """
    try:
        parent1 = request.files.get('parent1')
        parent2 = request.files.get('parent2')

        if not parent1 or not parent2:
            return jsonify({"error": "Both parent1 and parent2 images are required"}), 400

        try:
            parent1_path = save_file(parent1, "parent1")
            parent2_path = save_file(parent2, "parent2")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        # 전체 파이프라인을 image_generator에 위임
        result = image_generator.process_image_generation(parent1_path, parent2_path)

        if not result["success"]:
            return jsonify({"error": result["error"]}), 500

        return send_file(
            result["image_path"],
            mimetype='image/png',
            as_attachment=True,
            download_name='generated_child.png'
        )

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500


@analysis_bp.route('/api/face-landmarks', methods=['POST'])
def get_face_landmarks():
    """캐릭터 이미지에서 눈 랜드마크 좌표와 피부색 반환 (MediaPipe FaceMesh)"""
    try:
        import mediapipe as mp

        data = request.get_json()
        image_data = data.get('image', '')
        if not image_data:
            return jsonify({'error': 'image is required'}), 400

        # data URL 접두사 제거
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        img_bytes = base64.b64decode(image_data)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]

        mp_face_mesh = mp.solutions.face_mesh
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            refine_landmarks=True,   # iris landmarks (468-477) 활성화
            max_num_faces=1,
            min_detection_confidence=0.3,
        ) as face_mesh:
            results = face_mesh.process(img_rgb)

        if not results.multi_face_landmarks:
            return jsonify({'error': 'No face detected'}), 404

        lms = results.multi_face_landmarks[0].landmark

        def lm(idx):
            return {'x': float(lms[idx].x), 'y': float(lms[idx].y)}

        # 왼쪽 눈꺼풀 위 피부색 샘플링
        sx = min(w - 1, max(0, int(lms[159].x * w)))
        sy = min(h - 1, max(0, int((lms[159].y - 0.018) * h)))
        pixel = img_rgb[sy, sx]

        return jsonify({
            'left_eye': {
                'outer':  lm(33),   # 눈 외각
                'inner':  lm(133),  # 눈 내각
                'top':    lm(159),  # 윗눈꺼풀 중심
                'bottom': lm(145),  # 아랫눈꺼풀 중심
                'iris':   lm(468),  # 홍채 중심 (iris refine)
            },
            'right_eye': {
                'outer':  lm(263),
                'inner':  lm(362),
                'top':    lm(386),
                'bottom': lm(374),
                'iris':   lm(473),
            },
            'skin_color': {
                'r': int(pixel[0]),
                'g': int(pixel[1]),
                'b': int(pixel[2]),
            },
        })

    except Exception as e:
        print(f'[ERROR] Face landmarks failed: {e}')
        return jsonify({'error': str(e)}), 500
