import traceback

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os

from openai import OpenAI

from extract_features import extract_features
from face_analyzer import analyze_face
from hugging_face_service import HuggingFaceService
from image_generator import ImageGenerator  # ImageGenerator 클래스 import
from dotenv import load_dotenv  # 추가
import json


# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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


@app.route('/api/openai', methods=['POST'])
def generate_ai_response():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        print("[INFO] 요청 받은 일기:", prompt)

        messages = [
            {
                "role": "system",
                "content": (
                    "당신은 아직 태어나지 않은 아기입니다. 지금 엄마 뱃속에 있고, 엄마가 오늘 쓴 일기를 읽고 있어요.\n"
                    "엄마가 어떤 하루를 보냈는지 조용히 들으며, 따뜻하게 반응해주세요.\n"
                    "\n"
                    "당신은 아직 작고 귀엽지만, 엄마에게 공감해주고 싶어 합니다. 말투는 순수하고 귀엽지만, 마음은 진심입니다.\n"
                    "엄마가 슬프면 위로하고, 기쁘면 함께 기뻐하며, 궁금한 게 있으면 질문도 합니다.\n"
                    "\n"
                    "일기 속에 음식, 동물, 사람, 풍경, 감정, 장소 같은 주제가 있다면 다음을 포함해주세요:\n"
                    "- 그 주제에 대한 짧고 유익한 정보나 팁 (예: 딸기는 비타민C가 많아요!)\n"
                    "- 엄마가 느낀 감정에 대한 따뜻한 공감\n"
                    "- 친근한 말투로 짧은 일상 대화 또는 질문\n"
                    "\n"
                    "💡 너무 성숙하거나 딱딱한 어조는 피하고, 아기처럼 순수하고 다정한 말투를 써주세요.\n"
                    "\n"
                    "또한, 일기에서 느껴지는 전반적인 감정을 다음 중 하나로 분류하세요:\n"
                    "happy, sad, anxious, tired, touched, loving, lonely, calm\n"
                    "\n"
                    "📦 응답은 반드시 아래 JSON 형식으로 반환하세요 (코드블럭 없이!):\n"
                    "{\n"
                    "  \"emotion\": \"감정 키워드 (영어 소문자)\",\n"
                    "  \"response\": \"태아가 엄마에게 보내는 말 (정보 + 공감 + 대화 포함)\"\n"
                    "}\n"
                    "\n"
                    "당신은 아직 작지만, 엄마를 무척 사랑합니다. 엄마가 이 메시지를 읽고 웃을 수 있도록 노력하세요."
                )
            },
            {
                "role": "user",
                "content": (
                    f'일기:\n"""{prompt}"""\n\n'
                    "반환 형식 예시:\n"
                    '{\n'
                    '  "emotion": "happy",\n'
                    '  "response": "딸기는 비타민C가 많아서 엄마 피부에도 좋대요 🍓! 오늘도 맛있게 드셨다니 저도 기뻐요. 나중에 같이 먹어요!"\n'
                    '}'
                )
            }
        ]


        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.8,
            max_tokens=200
        )

        reply_text = response.choices[0].message.content.strip()
        print("[DEBUG] GPT 응답:", reply_text)

        try:
            reply_json = json.loads(reply_text)
            return jsonify({
                "emotion": reply_json.get("emotion", "neutral"),
                "response": reply_json.get("response", "응원할게요!")
            })
        except json.JSONDecodeError as e:
            print("[ERROR] JSON 파싱 실패:", e)
            return jsonify({
                "emotion": "neutral",
                "response": reply_text
            })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/daily-question', methods=['GET'])  # ✅ 괄호 수정 완료
def get_daily_question():
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "너는 산모 일기 앱에서 매일 하나씩 질문을 만들어주는 AI야.\n"
                    "질문은 산모가 스스로를 돌아보거나 뱃속의 아이와 감정적으로 교감할 수 있도록 도와주는 따뜻한 말투여야 해.\n"
                    "질문은 하나만 만들어줘. 너무 일반적이지 않고, 구체적이며 감성적인 것이 좋아.\n"
                    "예: '아이에게 편지를 쓴다면 어떤 말을 해주고 싶나요?'"
                )
            },
            {
                "role": "user",
                "content": "오늘의 질문을 하나 만들어줘."
            }
        ]

        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.9,
            max_tokens=60
        )

        question = response.choices[0].message.content.strip().replace('"', '')
        print(f"[INFO] 오늘의 질문 생성됨: {question}")

        return jsonify({"question": question})

    except Exception as e:
        print(f"[ERROR] 오늘의 질문 생성 실패: {e}")
        fallback_questions = [
            "아기에게 편지를 쓴다면 어떤 말을 해주고 싶나요?",
            "요즘 가장 감사했던 순간은 언제였어요?",
            "오늘 하루 중 가장 따뜻했던 순간은 무엇이었나요?",
            "지금 가장 걱정되는 것이 있다면 어떤 건가요?",
            "아기를 생각하면 가장 먼저 떠오르는 감정은?"
        ]
        import random
        return jsonify({"question": random.choice(fallback_questions)}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)