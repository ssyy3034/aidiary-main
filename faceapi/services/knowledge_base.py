import os
import chromadb
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class KnowledgeBase:
    def __init__(self):
        # Initialize Embeddings
        self.embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

        # Initialize ChromaDB
        # Persist data to 'chroma_db' folder in the root or a specific volume
        self.persist_directory = "./chroma_db"

        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="medical_knowledge"
        )

    def get_retriever(self, k=3):
        """Returns a retriever for the vector store."""
        return self.vector_store.as_retriever(search_kwargs={"k": k})

    def ingest_medical_data(self):
        """
        Ingests initial medical data into the vector database.
        This is a placeholder/utility function to populate the DB with some facts.
        """
        # Example medical data (stub)
        medical_facts = [
            "임신 초기(1~12주)에는 엽산 섭취가 매우 중요합니다.",
            "임신 중기(13~27주)에는 철분제를 복용해야 빈혈을 예방할 수 있습니다.",
            "임신 후기(28주~)에는 조산의 징후를 주의 깊게 관찰해야 합니다.",
            "임산부는 생선회나 익히지 않은 고기를 피하는 것이 좋습니다 (식중독 위험).",
            "입덧 완화에는 조금씩 자주 먹는 식습관이 도움이 됩니다.",
            "카페인은 하루 200mg 이하로 섭취하는 것이 좋습니다.",
            "임신 중 가벼운 걷기 운동은 혈액순환과 체중 관리에 도움이 됩니다."
        ]

        documents = [Document(page_content=fact, metadata={"source": "medical_guidelines"}) for fact in medical_facts]

        # Check if DB is empty to avoid duplicate ingestion for this demo
        if self.vector_store._collection.count() == 0:
            print("[INFO] Vector DB is empty. Ingesting initial medical data...")
            self.vector_store.add_documents(documents)
            print("[INFO] Ingestion complete.")
        else:
            print(f"[INFO] Vector DB already contains {self.vector_store._collection.count()} documents.")

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        """Adds new documents to the vector store."""
        self.vector_store.add_texts(texts=texts, metadatas=metadatas)

    def ingest_from_urls(self, urls: list[str]):
        """
        Ingests content from a list of URLs.
        Requires 'beautifulsoup4' to be installed.
        """
        try:
            from langchain_community.document_loaders import WebBaseLoader
        except ImportError:
            print("[ERROR] 'beautifulsoup4' or 'langchain_community' not found. Please install them.")
            return

        print(f"[INFO] Loading content from {len(urls)} URLs...")

        # 1. Load Documents
        loader = WebBaseLoader(urls)
        params = {"verify": False} # Skip SSL verification in development if needed
        loader.requests_kwargs = params
        documents = loader.load()

        # 2. Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        split_docs = text_splitter.split_documents(documents)

        # 3. Ingest to Vector DB
        if split_docs:
            self.vector_store.add_documents(split_docs)
            print(f"[INFO] Successfully ingested {len(split_docs)} chunks from URLs.")
        else:
            print("[WARN] No content extracted from URLs.")
