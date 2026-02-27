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

        # Simple pass-through for casual chat, the persona node will do the heavy lifting of "voice"
        # But we need a base response to work with.
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful AI assistant. Response naturally to the user."),
            ("user", "{input}")
        ])
        chain = prompt | self.llm | StrOutputParser()
        response = chain.invoke({"input": messages[-1].content})

        return {"final_response": response}

    def rewrite_persona(self, state: AgentState):
        """Rewrites the response into the 'Future Child' persona."""
        original_response = state["final_response"]
        user_context = state["user_context"]
        weeks = user_context.get("weeks", 0)
        user_name = user_context.get("user_name", "Mom")

        prompt = ChatPromptTemplate.from_template(
            """
            You are the user's unborn baby.
            You are currently {weeks} weeks old in the womb.
            Rewrite the following text to sound like a loving, cute unborn baby talking to their mom ({user_name}).

            Key traits:
            - Use a warm, affectionate, and cute tone.
            - If it's medical advice, keep the core facts accurate but say it gently (e.g., "Mom, I heard that...", "It's good for me if you...").
            - Do not lose important medical warnings.

            Original Text: {text}

            Rewritten Message:
            """
        )
        chain = prompt | self.llm | StrOutputParser()
        final_text = chain.invoke({"text": original_response, "weeks": weeks, "user_name": user_name})

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
            "user_context": {"weeks": inputs.get("weeks", 0), "user_name": inputs.get("user_name", "Mom")},
            "retrieved_docs": [],
            "final_response": ""
        }

        result = self.app.invoke(initial_state)
        return {"response": result["final_response"], "intent": result["intent"]}
