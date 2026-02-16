# LangGraph 챗봇 구현 가이드

이 문서는 LangGraph 기반 챗봇 서비스의 아키텍처와 유지보수 방법을 설명합니다.

## 1. 시스템 아키텍처

이 챗봇은 **LangGraph**로 조율되는 **멀티 에이전트 RAG (검색 증강 생성)** 아키텍처를 사용합니다.

### 워크플로우

1.  **입력**: 사용자 메시지 + 컨텍스트 (임신 주수, 사용자 이름).
2.  **의도 분류 (Intent Classification)**: `gpt-4`가 입력을 `medical`(의학), `casual`(일상), `diary`(일기)로 분류합니다.
3.  **라우팅**:
    - **Medical**: 벡터 DB 조회 -> 전문가 답변 생성 -> 아이 페르소나로 변환.
    - **Casual/Diary**: 일상 답변 생성 -> 아이 페르소나로 변환.
4.  **페르소나 변환 (Persona Rewrite)**: 전용 노드가 최종 출력을 항상 "미래의 아이" 말투로 변환합니다.

## 2. 주요 구성 요소

### A. 그래프 정의 (`services/chat_graph.py`)

- `AgentState` 정의 (메시지, 의도, 컨텍스트 등).
- 노드(`classify_intent`, `retrieve_documents` 등) 및 엣지(Edge) 구성.
- **수정 포인트**: 새로운 워크플로우(예: "응급 모드")를 추가하려면 새 노드를 추가하고 `route_based_on_intent` 함수를 업데이트하세요.

### B. 벡터 데이터베이스 (`services/knowledge_base.py`)

- **기술 스택**: ChromaDB (로컬 저장소 `./chroma_db`).
- **임베딩**: `sentence-transformers/all-MiniLM-L6-v2`.
- **데이터 수집**: 현재 `ingest_medical_data()` 스텁(stub) 사용.
- **유지보수**:
  - 더 많은 의학 지식을 추가하려면 `add_documents(texts)`를 호출하거나 `ingest_medical_data` 내의 `medical_facts` 리스트를 업데이트하세요.
  - DB는 서버 시작 시 비어있으면 자동으로 채워집니다.

### C. API 엔드포인트 (`routes/chat_routes.py`)

- 엔드포인트: `POST /api/openai`
- 입력 페이로드:
  ```json
  {
    "prompt": "사용자 메시지",
    "context": {
      "weeks": 20,
      "user_name": "엄마 이름"
    }
  }
  ```

## 3. 유지보수

### 페르소나 조정

`services/chat_graph.py`의 `rewrite_persona` 메서드에 있는 프롬프트를 수정하세요.

- 현재 특성: 사랑스럽고 귀여운, 태어날 아이.
- 팁: 안전을 위해 "중요한 의학적 경고는 누락하지 말 것"이라는 지침을 유지하세요.

### 의학 지식 업데이트

현재 시스템은 `knowledge_base.py`의 정적 리스트를 사용합니다.
확장하려면:

1.  외부 PDF/Text 파일을 로드합니다.
2.  `LangChain`의 문서 로더(Document Loaders)를 사용합니다.
3.  `knowledge_base.add_documents()`를 호출합니다.

## 4. 트러블슈팅

- **벡터 DB 문제**: 검색이 이상하면 `chroma_db` 폴더를 삭제하고 재시작하여 인덱스를 다시 빌드하세요.
- **Docker 빌드**: `torch`와 `sentence-transformers` 라이브러리 용량이 큽니다. Docker에 충분한 메모리(4GB+ 권장)가 할당되었는지 확인하세요.
