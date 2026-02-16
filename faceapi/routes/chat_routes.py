import json
import traceback
from flask import Blueprint, request, jsonify
from openai import OpenAI
from config import Config
import random


chat_bp = Blueprint('chat', __name__)

# Initialize Chat Graph
try:
    from services.chat_graph import ChatGraphApp
    chat_app = ChatGraphApp()
    print("[INFO] LangGraph Chat App Initialized")
except Exception as e:
    print(f"[ERROR] Failed to initialize LangGraph App: {e}")
    chat_app = None

@chat_bp.route('/api/openai', methods=['POST'])
def generate_ai_response():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        # Extract context from request, default to safe values if missing
        context = data.get("context", {})
        weeks = context.get("weeks", 0)
        user_name = context.get("user_name", "Mom")

        print(f"[INFO] 요청 받은 일기: {prompt}, 주차: {weeks}, 사용자: {user_name}")

        if chat_app:
            # Invoke LangGraph
            result = chat_app.invoke({
                "message": prompt,
                "weeks": weeks,
                "user_name": user_name
            })

            response_text = result["response"]
            intent = result["intent"]

            print(f"[INFO] LangGraph Output ({intent}): {response_text}")

            # Return standard JSON format expected by frontend
            # We can map 'intent' to 'emotion' if needed, or just default to 'happy'
            emotion_map = {
                "medical": "calm",
                "casual": "happy",
                "diary": "touched"
            }
            return jsonify({
                "emotion": emotion_map.get(intent, "happy"),
                "response": response_text,
                "intent": intent # Useful for debugging frontend
            })
        else:
            return jsonify({"error": "Chat service not initialized"}), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chat_bp.route('/api/daily-question', methods=['GET'])
def get_daily_question():
    try:
        # 1. Try OpenAI if client is available
        if client:
            try:
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "너는 산모 일기 앱에서 매일 하나씩 질문을 만들어주는 AI야.\n"
                            "질문은 산모가 스스로를 돌아보거나 뱃속의 아이와 감정적으로 교감할 수 있도록 도와주는 따뜻한 말투여야 해.\n"
                            "질문은 하나만 만들어줘. 너무 일반적이지 않고, 구체적이며 감성적인 것이 좋아. 질문의 길이는 공백포함 30글자가 넘어가면 안돼.\n"
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
                print(f"[INFO] 오늘의 질문 생성됨 (OpenAI): {question}")
                return jsonify({"question": question})

            except Exception as e:
                print(f"[WARN] OpenAI Daily Question Failed: {e}")
                # Continue to next fallback

        # 2. Try Hugging Face (GPT-2) via Service
        try:
            from services.hugging_face_service import HuggingFaceService
            hf_service = HuggingFaceService()
            prompt = "산모를 위한 따뜻한 감성적인 일기 주제 질문 하나만 짧게 만들어줘:"
            generated = hf_service.get_completion(prompt)

            # GPT-2 output cleaning might be needed as it can be messy
            if generated and len(generated) > 5:
                # Simple cleanup logic or just use it if it looks okay
                # For safety, we might skip this if we can't trust the quality,
                # but let's try to use it if it's not an error message
                if "오류" not in generated:
                    print(f"[INFO] 오늘의 질문 생성됨 (HuggingFace): {generated}")
                    return jsonify({"question": generated.split('\n')[0]}) # First line only
        except Exception as e:
            print(f"[WARN] Hugging Face Daily Question Failed: {e}")

        # 3. Fallback to Static List
        fallback_questions = [
            "아기에게 편지를 쓴다면 어떤 말을 해주고 싶나요?",
            "요즘 가장 감사했던 순간은 언제였어요?",
            "오늘 하루 중 가장 따뜻했던 순간은 무엇이었나요?",
            "지금 가장 걱정되는 것이 있다면 어떤 건가요?",
            "아기를 생각하면 가장 먼저 떠오르는 감정은?",
            "오늘 들었던 노래 중 아기에게 들려주고 싶은 곡이 있나요?",
            "엄마가 되면서 가장 변한 점은 무엇인가요?"
        ]
        selected = random.choice(fallback_questions)
        print(f"[INFO] 오늘의 질문 생성됨 (Fallback): {selected}")
        return jsonify({"question": selected}), 200

    except Exception as e:
        print(f"[ERROR] 오늘의 질문 생성 완전 실패: {e}")
        return jsonify({"question": "오늘 하루는 어땠나요?"}), 200
