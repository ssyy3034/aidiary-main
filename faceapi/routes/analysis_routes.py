from flask import Blueprint, request, jsonify, send_file
from services.face_analyzer import analyze_face
from services.feature_extractor import extract_features
from services.image_generator import ImageGenerator
from utils.file_utils import save_file

analysis_bp = Blueprint('analysis', __name__)
image_generator = ImageGenerator()

@analysis_bp.route('/api/diary-drawing', methods=['POST'])
def generate_diary_drawing():
    """
    일기 텍스트를 분석하여 '태아가 그린 그림일기'를 생성합니다.

    Request Body:
        { "diary_text": "오늘 아빠랑 딸기 먹어서 너무 행복했어." }

    Response:
        {
            "success": true,
            "image_url": "...",
            "analysis": { "sentiment": {...}, "keywords": [...] },
            "prompt": "..."
        }
    """
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
    """
    일기 텍스트의 감정/키워드만 분석합니다. (이미지 생성 없이 테스트용)

    Request Body:
        { "text": "오늘 산책하면서 꽃을 봤어" }
    """
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
    try:
        parent1 = request.files.get('parent1')
        parent2 = request.files.get('parent2')

        if not parent1 or not parent2:
            return jsonify({"error": "Both parent1 and parent2 images are required"}), 400

        # 보안이 강화된 파일 저장 (고유 파일명 사용)
        try:
            parent1_path = save_file(parent1, "parent1")
            parent2_path = save_file(parent2, "parent2")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

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
