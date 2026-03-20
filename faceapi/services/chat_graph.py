from typing import List
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import Config
from services.knowledge_base import KnowledgeBase
import logging

logger = logging.getLogger(__name__)


class ChatGraphApp:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=Config.GEMINI_API_KEY,
            temperature=0.7,
        )
        self.knowledge_base = KnowledgeBase()

    def _retrieve_context(self, query: str) -> str:
        """RAG 검색 — 의료 관련 문맥을 가져온다 (LLM 호출 아님, 벡터 검색만)."""
        try:
            retriever = self.knowledge_base.get_retriever(k=3)
            docs = retriever.invoke(query)
            if docs:
                return "\n".join(d.page_content for d in docs)
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")
        return ""

    def _classify_intent(self, message: str, rag_context: str) -> str:
        """RAG 결과 유무로 의도를 간이 판별 (LLM 호출 없음)."""
        medical_keywords = [
            "약", "병원", "진통", "출혈", "통증", "두통", "입덧", "구토",
            "태동", "수축", "혈압", "당뇨", "빈혈", "엽산", "철분", "검사",
            "초음파", "양수", "진료", "위험", "안전", "먹어도", "괜찮",
            "증상", "열", "감기", "약물", "운동", "카페인", "음식",
        ]
        lower_msg = message.lower()
        has_medical_keyword = any(kw in lower_msg for kw in medical_keywords)

        if has_medical_keyword and rag_context:
            return "medical"
        return "casual"

    def invoke(self, inputs: dict):
        """
        단일 LLM 호출로 의도 파악 + 응답 생성 + 페르소나를 한 번에 처리.

        inputs: {"message": str, "weeks": int, "user_name": str,
                 "personality": str, "child_name": str, "recent_diary": str}
        """
        message = inputs["message"]
        weeks = inputs.get("weeks", 0)
        child_name = inputs.get("child_name", "") or "아기"
        personality = inputs.get("personality", "")
        recent_diary = inputs.get("recent_diary", "")

        # 1. RAG 검색 (벡터 검색만, LLM 호출 없음)
        rag_context = self._retrieve_context(message)

        # 2. 키워드 기반 의도 판별 (LLM 호출 없음)
        intent = self._classify_intent(message, rag_context)

        # 3. 컨텍스트 블록 조립
        medical_block = ""
        if intent == "medical" and rag_context:
            medical_block = (
                "\n[참고 의료 정보]\n"
                f"{rag_context}\n"
                "위 정보를 참고하되, 정확하지 않을 수 있으니 반드시 병원 방문을 권유하세요.\n"
            )

        personality_block = ""
        if personality:
            personality_block = (
                "\n[아이 성격 특성]\n"
                f"{personality}\n"
                "이 특성을 말투와 태도에 자연스럽게 녹여 표현하세요 (명시적 언급 금지).\n"
            )

        diary_block = ""
        if recent_diary:
            diary_block = f"\n[엄마의 최근 일기]\n{recent_diary}\n"

        # 4. 통합 프롬프트 (1회 LLM 호출)
        system_prompt = f"""당신은 엄마 뱃속에 있는 아직 태어나지 않은 아기입니다.
현재 임신 {weeks}주차이며, 태명은 "{child_name}"입니다.
{personality_block}{medical_block}{diary_block}
핵심 규칙:
- 반드시 한국어로만 대답
- 엄마를 "엄마"라고 부름 (이름이나 ID 절대 사용 금지)
- 따뜻하고 애정 넘치는 아기 말투 (~요, ~죠, ~어요! 등)
- 뱃속에서 행복하게 자라고 있다는 느낌을 전달
- 의료 질문에는 참고 정보를 바탕으로 정확하게 답하되, 아기가 걱정해주는 듯 부드럽게 전달하고 병원 방문을 권유
- 일상 대화에는 공감하며 사랑스럽게 반응
- 마크다운 문법 절대 사용 금지 (**, *, #, -, ` 등 기호 사용 금지)
- 자연스러운 줄바꿈으로 읽기 쉽게 작성"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])

        chain = prompt | self.llm | StrOutputParser()
        response = chain.invoke({"input": message})

        return {"response": response, "intent": intent}
