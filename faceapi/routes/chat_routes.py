import json
import re
import traceback
from flask import Blueprint, request, jsonify
from openai import OpenAI
from config import Config
import random


chat_bp = Blueprint('chat', __name__)

# Lazy loaded Chat Graph App
_chat_app = None

def get_chat_app():
    global _chat_app
    if _chat_app is None:
        try:
            from services.chat_graph import ChatGraphApp
            _chat_app = ChatGraphApp()
            print("[INFO] LangGraph Chat App Initialized")
        except Exception as e:
            print(f"[ERROR] Failed to initialize LangGraph App: {e}")
            _chat_app = None
    return _chat_app

# Initialize OpenAI Client
client = None
if Config.OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        print("[INFO] OpenAI Client Initialized")
    except Exception as e:
        print(f"[ERROR] Failed to initialize OpenAI Client: {e}")

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

        if get_chat_app():
            # Invoke LangGraph
            result = get_chat_app().invoke({
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

                question = response.choices[0].message.content.strip()
                question = re.sub(r'[*_\"\'`]', '', question).strip()
                print(f"[INFO] 오늘의 질문 생성됨 (OpenAI): {question}")
                return jsonify({"question": question})

            except Exception as e:
                print(f"[WARN] OpenAI Daily Question Failed: {e}")
                # Continue to next fallback

        # 2. Try Gemini fallback
        if Config.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types

                gemini_client = genai.Client(api_key=Config.GEMINI_API_KEY)
                gen_prompt = (
                    "너는 산모 일기 앱에서 매일 하나씩 질문을 만들어주는 AI야.\n"
                    "질문은 산모가 스스로를 돌아보거나 뱃속의 아이와 감정적으로 교감할 수 있도록 도와주는 따뜻한 말투여야 해.\n"
                    "질문은 하나만 만들어줘. 너무 일반적이지 않고, 구체적이며 감성적인 것이 좋아. 질문의 길이는 공백포함 30글자가 넘어가면 안돼.\n"
                    "예: '아이에게 편지를 쓴다면 어떤 말을 해주고 싶나요?'\n"
                    "오늘의 질문을 하나 만들어줘."
                )

                response = gemini_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=gen_prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.8,
                        max_output_tokens=50,
                    )
                )

                if response and response.text:
                    question = response.text.strip()
                    # Strip quotes and common markdown like ** or *
                    question = re.sub(r'[*_\"\'`]', '', question).strip()
                    print(f"[INFO] 오늘의 질문 생성됨 (Gemini): {question}")
                    return jsonify({"question": question})
            except Exception as e:
                print(f"[WARN] Gemini Daily Question Failed: {e}")

        # 3. Last Fallback: Static List (Hugging Face is unreliable/outdated)
        fallback_questions = [
            "오늘 당신의 마음 날씨는 어떤가요?",
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
