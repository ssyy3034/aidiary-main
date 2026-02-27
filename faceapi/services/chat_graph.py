from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from config import Config
from services.knowledge_base import KnowledgeBase
import json

# --- State Definition ---
class AgentState(TypedDict):
    messages: List[BaseMessage]
    intent: str
    user_context: dict  # e.g., {"weeks": 20, "user_name": "Mom"}
    retrieved_docs: List[str]
    final_response: str

# --- Graph Class ---
class ChatGraphApp:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=Config.GEMINI_API_KEY, temperature=0.7)
        self.knowledge_base = KnowledgeBase()
        # self.knowledge_base.ingest_medical_data() # Disabled: Use ingest.py for trusted data

        self.workflow = self._build_graph()
        self.app = self.workflow.compile()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Add Nodes
        workflow.add_node("classifier", self.classify_intent)
        workflow.add_node("rag_retrieval", self.retrieve_documents)
        workflow.add_node("medical_expert", self.generate_medical_answer)
        workflow.add_node("casual_chat", self.generate_casual_chat)
        workflow.add_node("persona_rewrite", self.rewrite_persona)

        # Set Entry Point
        workflow.set_entry_point("classifier")

        # Add Conditional Edges
        workflow.add_conditional_edges(
            "classifier",
            self.route_based_on_intent,
            {
                "medical": "rag_retrieval",
                "casual": "casual_chat",
                "diary": "casual_chat" # Treat diary entry as casual for now, or add specific node later
            }
        )

        # Add Edges
        workflow.add_edge("rag_retrieval", "medical_expert")
        workflow.add_edge("medical_expert", "persona_rewrite")
        workflow.add_edge("casual_chat", "persona_rewrite")
        workflow.add_edge("persona_rewrite", END)

        return workflow

    # --- Nodes ---

    def classify_intent(self, state: AgentState):
        """Classifies the user's input intent."""
        messages = state["messages"]
        last_message = messages[-1].content

        prompt = ChatPromptTemplate.from_template(
            """
            Analyze the user's input and classify the intent into one of the following categories:
            - 'medical': The user is asking for medical advice, health information, or pregnancy safety.
            - 'casual': The user is having a casual conversation, greeting, or expressing general emotions.
            - 'diary': The user is sharing a diary entry about their day.

            User Input: {input}

            Return ONLY the category name (medical, casual, or diary) in JSON format like: {{"intent": "category"}}
            """
        )
        chain = prompt | self.llm | JsonOutputParser()
        result = chain.invoke({"input": last_message})
        return {"intent": result.get("intent", "casual")}

    def retrieve_documents(self, state: AgentState):
        """Retrieves relevant medical documents."""
        query = state["messages"][-1].content
        retriever = self.knowledge_base.get_retriever()
        docs = retriever.invoke(query)
        doc_texts = [d.page_content for d in docs]
        return {"retrieved_docs": doc_texts}

    def generate_medical_answer(self, state: AgentState):
        """Generates a medical answer based on retrieved docs."""
        query = state["messages"][-1].content
        docs = state["retrieved_docs"]
        context_str = "\n".join(docs)

        weeks = state.get("user_context", {}).get("weeks", "unknown")

        prompt = ChatPromptTemplate.from_template(
            """
            You are a helpful medical assistant for a pregnant woman.
            Use the following context to answer the user's question.
            Do not make up information. If the answer is not in the context, use general safe medical knowledge but mention you are not a doctor.

            Context: {context}
            User's Pregnancy Week: {weeks}
            Question: {question}

            Answer clearly and factually.
            """
        )
        chain = prompt | self.llm | StrOutputParser()
        answer = chain.invoke({"context": context_str, "weeks": weeks, "question": query})
        return {"final_response": answer} # Temporarily store here, to be rewritten

    def generate_casual_chat(self, state: AgentState):
        """Generates a casual response."""
        messages = state["messages"]
        ctx = state.get("user_context", {})
        recent_diary = ctx.get("recent_diary", "")

        system_msg = "You are a helpful AI assistant. Respond warmly in Korean."
        if recent_diary:
            system_msg += f"\n\nContext: The user recently wrote in their diary:\n{recent_diary}"

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_msg),
            ("user", "{input}")
        ])
        chain = prompt | self.llm | StrOutputParser()
        response = chain.invoke({"input": messages[-1].content})

        return {"final_response": response}

    def rewrite_persona(self, state: AgentState):
        """Rewrites the response into the 'Future Child' persona."""
        ctx = state.get("user_context", {})
        weeks = ctx.get("weeks", 0)
        child_name = ctx.get("child_name", "") or "아기"
        personality = ctx.get("personality", "")

        personality_block = ""
        if personality:
            personality_block = f"""
아래는 부모 성격 분석을 바탕으로 예측된 이 아이의 성격 특성입니다.
이 특성을 말투·태도에 자연스럽게 녹여 표현하세요 (억지로 언급하지 말 것):
---
{personality}
---"""

        prompt_template = """당신은 엄마 뱃속에 있는 아직 태어나지 않은 아기입니다. 반드시 한국어로 대답하세요.
현재 임신 {weeks}주차이며, 이 아기의 태명은 "{child_name}"입니다.
{personality_block}

다음 내용을 엄마에게 말하는 사랑스럽고 귀여운 태아의 목소리로 바꿔 쓰세요.

핵심 규칙:
- 항상 한국어로만 대답
- 엄마를 "엄마"라고 부름 (이름/ID 절대 사용 금지)
- 따뜻하고 애정 넘치는 말투 (~요, ~죠, ~어요! 등)
- 뱃속에서 행복하게 자라고 있다는 느낌
- 의료 정보는 핵심 사실을 지키되 아기가 걱정해주는 듯 부드럽게 전달
- 성격 특성은 말투·어휘에 자연스럽게 녹일 것 (명시적 언급 금지)

원문: {text}

바꿔 쓴 메시지 (한국어):"""

        chain = ChatPromptTemplate.from_template(prompt_template) | self.llm | StrOutputParser()
        final_text = chain.invoke({
            "text": state["final_response"],
            "weeks": weeks,
            "child_name": child_name,
            "personality_block": personality_block,
        })
        return {"final_response": final_text}

    # --- Router ---
    def route_based_on_intent(self, state: AgentState):
        return state["intent"]

    # --- Public API ---
    def invoke(self, inputs: dict):
        """
        Invokes the graph with the given inputs.
        inputs: {"message": str, "weeks": int, "user_name": str}
        """
        initial_state = {
            "messages": [HumanMessage(content=inputs["message"])],
            "intent": "casual",
            "user_context": {
                "weeks":        inputs.get("weeks", 0),
                "user_name":    inputs.get("user_name", "엄마"),
                "personality":  inputs.get("personality", ""),
                "child_name":   inputs.get("child_name", ""),
                "recent_diary": inputs.get("recent_diary", ""),
            },
            "retrieved_docs": [],
            "final_response": ""
        }

        result = self.app.invoke(initial_state)
        return {"response": result["final_response"], "intent": result["intent"]}
