import json
import re
from flask import Blueprint, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from config import Config

pregnancy_bp = Blueprint('pregnancy', __name__)

# 태아 크기 정보는 의학적 사실이므로 정적 데이터로 유지
WEEK_SIZES = {
    1:  ("양귀비씨",           "0.1cm",    "1g 미만"),
    2:  ("참깨",               "0.1cm",    "1g 미만"),
    3:  ("겨자씨",             "0.1cm",    "1g 미만"),
    4:  ("양귀비 꽃봉오리",    "0.2cm",    "1g 미만"),
    5:  ("참깨",               "0.4cm",    "1g 미만"),
    6:  ("완두콩",             "0.6cm",    "1g 미만"),
    7:  ("블루베리",           "1.3cm",    "1g"),
    8:  ("라즈베리",           "1.6cm",    "1g"),
    9:  ("체리",               "2.3cm",    "2g"),
    10: ("딸기",               "3.1cm",    "4g"),
    11: ("무화과",             "4.1cm",    "7g"),
    12: ("라임",               "5.4cm",    "14g"),
    13: ("복숭아",             "7.4cm",    "23g"),
    14: ("레몬",               "8.7cm",    "43g"),
    15: ("사과",               "10.1cm",   "70g"),
    16: ("아보카도",           "11.6cm",   "100g"),
    17: ("무",                 "13.0cm",   "140g"),
    18: ("고구마",             "14.2cm",   "190g"),
    19: ("망고",               "15.3cm",   "240g"),
    20: ("바나나",             "16.4cm",   "300g"),
    21: ("당근",               "26.7cm",   "360g"),
    22: ("파파야",             "27.8cm",   "430g"),
    23: ("생망고",             "28.9cm",   "501g"),
    24: ("옥수수",             "30.0cm",   "600g"),
    25: ("순무",               "34.6cm",   "660g"),
    26: ("케일",               "35.6cm",   "760g"),
    27: ("상추 한 포기",       "36.6cm",   "875g"),
    28: ("가지",               "37.6cm",   "1005g"),
    29: ("호박",               "38.6cm",   "1153g"),
    30: ("양배추",             "39.9cm",   "1319g"),
    31: ("코코넛",             "41.1cm",   "1502g"),
    32: ("잭프루트 작은 것",   "42.4cm",   "1702g"),
    33: ("파인애플",           "43.7cm",   "1918g"),
    34: ("멜론",               "45.0cm",   "2146g"),
    35: ("허니듀 멜론",        "46.2cm",   "2383g"),
    36: ("파파야 큰 것",       "47.4cm",   "2622g"),
    37: ("스위스 차드 한 묶음","48.6cm",   "2859g"),
    38: ("부추 한 단",         "49.8cm",   "3083g"),
    39: ("수박 작은 것",       "50.7cm",   "3288g"),
    40: ("호박 큰 것",         "51.2cm",   "3462g"),
    41: ("파인애플 큰 것",     "51.7cm",   "3597g"),
    42: ("수박",               "51.7cm 이상", "3685g 이상"),
}


def _build_prompt(week: int) -> str:
    trimester = (
        "임신 1기 (초기)"  if week <= 12 else
        "임신 2기 (중기)"  if week <= 27 else
        "임신 3기 (후기)"
    )
    return f"""임신 {week}주차({trimester}) 산모를 위한 정보를 아래 JSON 형식으로만 응답하세요.
마크다운 코드 블록 없이 순수 JSON만 출력하세요.

{{
  "development": "태아 발달 상황 2~3문장 (구체적 신체 부위 언급)",
  "maternalChanges": "산모 신체·정서 변화 2~3문장",
  "tip": "이번 주 가장 중요한 실천 팁 한 문장",
  "recommendedFoods": ["영양 보충에 좋은 음식1", "음식2", "음식3"],
  "safeExercises": ["임신 {week}주차에 안전한 운동1", "운동2"],
  "warningSign": "즉시 병원에 가야 할 위험 증상 한 문장",
  "emotionalSupport": "산모를 위한 따뜻한 응원 메시지 한 문장",
  "checkup": "이번 주 권장 검사·병원 방문 사항 (해당 없으면 null)"
}}"""


@pregnancy_bp.route('/api/pregnancy/week-content', methods=['GET'])
def get_week_content():
    week = request.args.get('week', type=int)

    if not week or week < 1 or week > 42:
        return jsonify({"error": "유효하지 않은 임신 주차입니다. 1~42 사이 값을 입력하세요."}), 400

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=Config.GEMINI_API_KEY,
            temperature=0.3,
        )
        response = llm.invoke([HumanMessage(content=_build_prompt(week))])
        text = response.content.strip()
        text = re.sub(r'```json\n?|\n?```', '', text).strip()
        ai_data = json.loads(text)

    except json.JSONDecodeError as e:
        return jsonify({"error": f"AI 응답 파싱 실패: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"AI 호출 실패: {str(e)}"}), 500

    size = WEEK_SIZES.get(week, ("알 수 없음", "-", "-"))
    result = {
        "week": week,
        "babySize":   size[0],
        "babySizeCm": size[1],
        "babyWeightG": size[2],
        **ai_data,
    }
    return jsonify(result)
