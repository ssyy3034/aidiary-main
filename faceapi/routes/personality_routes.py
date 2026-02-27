from flask import Blueprint, request, jsonify
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from config import Config

personality_bp = Blueprint('personality', __name__)


@personality_bp.route('/api/personality-chat', methods=['POST'])
def personality_chat():
    data = request.get_json()
    message = data.get("message", "")
    history = data.get("history", [])
    parent_label = data.get("parent_label", "부모")
    turn_count = data.get("turn_count", 0)

    completion_hint = ""
    if turn_count >= 14:
        completion_hint = "\n대화가 충분히 이루어졌습니다. 이번 응답 마지막에 반드시 [ASSESSMENT_COMPLETE]를 포함하세요."

    system_prompt = f"""당신은 산모일기 앱에서 부모 성격을 파악하는 따뜻한 AI 인터뷰어입니다.
{parent_label}과 자연스러운 한국어 대화로 Big Five(OCEAN) 5차원을 평가하세요.

평가 차원 (각 2~3턴):
- 개방성(O): 새로운 경험, 창의성, 호기심
- 성실성(C): 계획성, 조직력, 책임감
- 외향성(E): 사교성, 에너지, 교류 선호
- 친화성(A): 공감력, 협력, 배려
- 정서적 안정성(N): 스트레스 대처, 감정 조절

원칙:
- 항상 한국어
- 임신/육아 맥락의 경험 기반 질문 (직접 평가 질문 금지)
- 한 번에 하나의 질문만
- 공감 후 자연스럽게 다음 주제로 전환{completion_hint}"""

    lc_messages = [SystemMessage(content=system_prompt)]
    for h in history:
        if h["role"] == "user":
            lc_messages.append(HumanMessage(content=h["content"]))
        else:
            lc_messages.append(AIMessage(content=h["content"]))
    lc_messages.append(HumanMessage(content=message))

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=Config.GEMINI_API_KEY,
        temperature=0.8
    )
    reply = llm.invoke(lc_messages).content
    is_complete = "[ASSESSMENT_COMPLETE]" in reply

    return jsonify({
        "response": reply.replace("[ASSESSMENT_COMPLETE]", "").strip(),
        "is_complete": is_complete
    })


@personality_bp.route('/api/personality-synthesize', methods=['POST'])
def personality_synthesize():
    data = request.get_json()
    p1 = data.get("parent1_history", [])
    p2 = data.get("parent2_history", [])

    def to_text(history, label):
        lines = [f"[{label} 인터뷰]"]
        for h in history:
            prefix = "부모: " if h["role"] == "user" else "AI: "
            lines.append(prefix + h["content"])
        return "\n".join(lines)

    conversation = to_text(p1, "부모 1") + "\n\n" + to_text(p2, "부모 2")

    synthesis_prompt = f"""아래는 임신 중인 부모 두 사람과의 Big Five 성격 인터뷰 기록입니다.
유전심리학 전문가 관점에서 두 부모의 성격을 분석하고 아이 성격을 예측하세요.

{conversation}

반드시 아래 마크다운 형식으로만 응답하세요:

```markdown
## 🧬 유전적 성격 경향
- (OCEAN 차원별 부모 패턴)

## ✨ 성격 키워드
- 키워드1
- 키워드2
- 키워드3
- 키워드4
- 키워드5

## 🧠 간단한 성격 설명
(아이 예상 성격 2~3문장)

## 🌱 아이 성격 발달 예측
(유전 40~50% + 환경 영향 기반 양육 팁)
```"""

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=Config.GEMINI_API_KEY,
        temperature=0.5
    )
    result = llm.invoke([HumanMessage(content=synthesis_prompt)]).content
    return jsonify({"personality_profile": result})
