# 📂 Project: Aidiary

> **"Java의 안정성과 Python의 확장성을 결합한 멀티모달 AI 육아 플랫폼"**

## 1. 프로젝트 개요 (Overview)

- **서비스명**: Aidiary (AI 산모 일기)
- **개발 인원**: 1인 (Full Stack)
- **프로젝트 성격**: Spring Boot와 Python AI 서비스를 연동한 **Polyglot & Hybrid Architecture** 프로젝트
- **핵심 기능**:
  - 부모 사진 기반 2세 얼굴 예측 (Face Analysis + Generative AI)
  - 일기 텍스트 기반 태아 그림일기 자동 생성 (Sentiment Analysis + Image Generation)
  - 성격/맥락 기반 AI 페르소나 챗봇 (Context-Aware Chat)
  - 육아 일기 CRUD 및 성장 기록 관리
  - JWT 기반 로그인/회원가입

---

## 2. 시스템 아키텍처 (Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React + TS)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  로그인  │  │  일기    │  │  챗봇   │  │  이미지 생성   │  │
│  │  /회원가입│  │  CRUD    │  │  (아기)  │  │  (그림일기)    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
└───────┼─────────────┼──────────────┼────────────────┼───────────┘
        │             │              │                │
        ▼             ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot (Java 17) — Port 8080                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  AuthService │  │  DiaryService│  │     ImageService      │  │
│  │  JWT 발급    │  │  CRUD + 소유 │  │  RestTemplate →       │  │
│  │  BCrypt 암호화│  │  자 검증     │  │  Flask /analyze       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Spring Security + JwtAuthenticationFilter               │   │
│  │  GlobalExceptionHandler (@ControllerAdvice)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         MariaDB                                  │
└─────────────────────────────────────────────────────────────────┘
        │ RestTemplate (multipart/form-data)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Python Flask (face-api) — Port 5001                 │
│                                                                  │
│  POST /api/diary-drawing          POST /analyze                  │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ 1. SentimentAnalyzer    │      │ 1. AILabTools API        │  │
│  │    XLM-RoBERTa (다국어) │      │    얼굴 특징점 추출      │  │
│  │ 2. KeywordExtractor     │      │ 2. extract_features()    │  │
│  │    Kiwi + KeyBERT       │      │ 3. generate_prompt()     │  │
│  │ 3. generate_fetal_prompt│      │ 4. DALL-E 이미지 생성    │  │
│  │ 4. HuggingFace SDXL     │      └──────────────────────────┘  │
│  │    (DALL-E fallback)    │                                     │
│  └─────────────────────────┘                                     │
│                                                                  │
│  POST /api/openai  →  GPT-4 아기 페르소나 응답                   │
│  GET  /api/daily-question  →  GPT-4 오늘의 질문 생성             │
│  GET  /api/images/<filename>  →  생성 이미지 서빙                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 아키텍처 및 차별점 (Key Highlights)

### 🏗 1. Hybrid AI Service Architecture

단일 언어의 한계를 극복하기 위해 **"적재적소(Right Tool for the Right Job)"** 원칙을 적용하여 아키텍처를 설계했습니다.

- **Spring Boot**: 복잡한 비즈니스 로직, 데이터 무결성 보장(Transactional), 보안(Security) 담당.
- **Python (Flask)**: Face Analysis, Image Generation 등 AI/ML 라이브러리 활용에 특화된 서비스 담당.
- **Inter-service Communication**: `RestTemplate`을 사용해 두 서비스 간의 통신 파이프라인을 구축하고, 무거운 AI 연산을 분리하여 메인 서버의 안정성을 확보했습니다.

### 🧠 2. End-to-End AI Pipeline (일기 → 그림일기)

단순 API 호출이 아닌, **데이터 전처리부터 생성까지 이어지는 완전한 파이프라인**을 구현했습니다.

```
일기 텍스트 입력
    │
    ▼
[1] SentimentAnalyzer (XLM-RoBERTa)
    cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual
    → { label: "happy", score: 0.85 }
    │
    ▼
[2] KeywordExtractor
    Kiwi (형태소 분석, NNG/NNP 명사 추출)
    → KeyBERT (paraphrase-multilingual-MiniLM-L12-v2) 상위 3개 선별
    → ["딸기", "아빠", "산책"]
    │
    ▼
[3] generate_fetal_prompt(sentiment, keywords)
    "Child's crayon drawing, naive art style, cute and colorful.
     A scene depicting: 딸기, 아빠, 산책. Atmosphere: happy..."
    │
    ▼
[4] HuggingFace Inference API
    stabilityai/stable-diffusion-xl-base-1.0
    (실패 시 DALL-E 3 fallback)
    │
    ▼
[5] 이미지 저장 → generated_images/generated_image_{timestamp}.png
    GET /api/images/<filename> 으로 서빙
```

---

## 4. 프론트엔드 구현 (Frontend)

### ☑️ 로그인 / 회원가입

- **JWT 기반 인증**: 로그인 성공 시 서버에서 발급한 JWT 토큰을 Zustand 스토어에 저장하고, 이후 모든 API 요청의 `Authorization: Bearer <token>` 헤더에 자동 첨부
- **Zustand 전역 상태**: 사용자 세션(`userId`, `token`, `username`)을 전역 스토어로 관리하여 Prop Drilling 없이 어디서든 접근 가능
- **Form 유효성 검사**: 클라이언트 측 입력 검증 후 서버 에러 메시지를 UI에 반영

### ☑️ 일기 CRUD

- **Custom Hook 분리**: `useDiary.ts` 등 비즈니스 로직을 View에서 분리(Separation of Concerns)하여 컴포넌트의 단순함 유지
- **페이지네이션**: 서버 사이드 페이지네이션(`Page<DiaryResponseDTO>`) 결과를 받아 무한 스크롤 또는 페이지 버튼으로 렌더링
- **소유자 기반 접근 제어**: 본인 일기만 수정/삭제 버튼이 노출되도록 `userId` 비교 처리
- **감정 태그**: 일기 작성 시 감정(`emotion`) 필드를 선택하여 저장, 목록에서 감정 아이콘으로 시각화

### ☑️ AI 이미지 생성 (프론트 → 백엔드 → face-api)

- 프론트에서 부모 이미지 2장을 `multipart/form-data`로 Spring Boot에 전송
- Spring Boot `ImageService`가 `RestTemplate`으로 Python face-api `/analyze`에 중계
- 생성된 이미지 URL을 응답받아 `<img>` 태그로 렌더링

---

## 5. 백엔드 구현 (Backend — Spring Boot)

### ☑️ 로그인 / 회원가입 (`AuthService`)

```java
// 회원가입: 중복 검사 → BCrypt 암호화 → 저장 → 즉시 JWT 발급
User user = User.builder()
    .username(request.getUsername())
    .password(passwordEncoder.encode(request.getPassword()))  // BCryptPasswordEncoder
    .email(request.getEmail())
    .role(Role.USER)
    .build();

String token = jwtTokenProvider.createToken(authentication, savedUser.getId());
```

- **중복 검사**: `username`, `email` 각각 `existsBy~` 쿼리로 사전 검증
- **보안 메시지 통일**: 로그인 실패 시 "아이디 또는 비밀번호가 올바르지 않습니다."로 통일하여 사용자 열거 공격(User Enumeration Attack) 방지
- **JWT 필터**: `JwtAuthenticationFilter`가 모든 요청에서 토큰을 검증하고 `SecurityContext`에 인증 객체 설정

### ☑️ 일기 CRUD (`DiaryService`)

```java
// 소유자 검증 패턴 (수정/삭제 공통)
if (!diary.getUser().getId().equals(userId)) {
    throw new SecurityException("본인의 일기만 수정할 수 있습니다.");
}
```

| 메서드               | 설명                                                     |
| -------------------- | -------------------------------------------------------- |
| `createDiary()`      | `@Transactional`, `Diary.builder()`로 생성 후 저장       |
| `updateDiary()`      | 소유자 검증 → dirty checking으로 자동 flush              |
| `deleteDiary()`      | 소유자 검증 → `deleteById()`                             |
| `getDiariesByUser()` | `Page<DiaryResponseDTO>` 반환, `createdAt` 내림차순 정렬 |

- **DTO 변환**: `DiaryResponseDTO.fromEntity(saved)`로 Entity를 직접 노출하지 않고 DTO로 변환하여 반환

### ☑️ AI 이미지 생성 중계 (`ImageService`)

```java
// Spring Boot → Python face-api 이미지 전달
MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
body.add("parent1", new FileSystemResource(parent1.getOriginalFilename(), parent1.getBytes()));
body.add("parent2", new FileSystemResource(parent2.getOriginalFilename(), parent2.getBytes()));

ResponseEntity<String> response = restTemplate.postForEntity(
    flaskApiUrl + "/analyze", requestEntity, String.class
);
```

- `ByteArrayResource`를 상속한 내부 클래스 `FileSystemResource`로 `MultipartFile`을 `RestTemplate`이 전송 가능한 형태로 변환

### ☑️ 이미지 생성 프롬프트 — 유전적 가중치 반영 로직

부모 얼굴 분석 결과를 기반으로 **유전적 확률 가중치**를 프롬프트에 반영합니다.

**유전 원리 (Perplexity 조사 기반)**:

- 눈 색: 갈색(우성) > 파란색(열성) — 부모 중 한 명이라도 갈색이면 자녀에게 우성 반영
- 얼굴형: 부모 평균값 + ±10% 랜덤 변이
- 피부 톤: 두 부모의 중간값 (다유전자 형질)
- 코 모양: 부모 중 더 두드러진 특징이 60% 확률로 우세

```python
# feature_extractor.py 기반 가중치 적용 예시
def apply_genetic_weight(parent1_val, parent2_val, dominance="codominant"):
    if dominance == "dominant":
        # 우성 형질: 더 강한 값 채택
        return max(parent1_val, parent2_val)
    elif dominance == "recessive":
        # 열성 형질: 두 부모 모두 열성일 때만 발현
        return min(parent1_val, parent2_val) if parent1_val < 0.3 and parent2_val < 0.3 else max(parent1_val, parent2_val)
    else:
        # 공우성(codominant): 평균값
        return (parent1_val + parent2_val) / 2
```

---

## 6. 기술적 역량 상세 (Technical Skills)

### ☕️ Backend & Java (Spring Boot)

- **Robust Error Handling (AOP)**
  - `GlobalExceptionHandler`(`@ControllerAdvice`)를 도입하여 예외 처리를 중앙화하고, `APIResponse` 표준 규격을 정의하여 클라이언트와의 통신 안정성을 높였습니다.
- **Modern Java & JPA Patterns**
  - `Optional`과 `Stream API`를 적극 활용하여 NPE 방지 및 가독성 높은 코드를 작성했습니다.
  - JPA Entity 설계 시 `@Builder` 패턴을 적용하여 객체 불변성과 생성 가독성을 확보했습니다.
  - 서비스 계층에 `@Transactional`을 적재적소에 배치하여 데이터 정합성을 보장했습니다.

### ⚛️ Frontend (React & TypeScript)

- **Custom Hooks Architecture**
  - `useCharacter.ts` 등 비즈니스 로직을 View에서 분리(Separation of Concerns)하여 컴포넌트의 단순함을 유지하고 로직 재사용성을 높였습니다.
- **Efficient State Management (Zustand)**
  - Redux의 복잡성을 덜어내고, **Zustand**를 도입하여 전역 상태(사용자 세션, 모달 등)를 효율적으로 관리했습니다.
  - Prop Drilling 문제를 해결하고 **Single Source of Truth** 원칙을 준수했습니다.
- **Design System & Utility-First CSS**
  - **TailwindCSS**를 사용하여 `backdrop-blur`, `glassmorphism` 등 모던 UI를 빠르게 구축하고, 디자인 토큰을 정의하여 UI 일관성을 유지했습니다.

### 🐳 DevOps & Infrastructure

- **Containerization**: Backend, Frontend, AI Service, Database 전 계층을 **Docker Compose**로 오케스트레이션하여 '실행 가능한 문서(Information as Code)'를 구현했습니다.
- **Observability**: **Prometheus & Grafana**를 연동하여 애플리케이션 리소스 사용량 및 상태를 모니터링하는 환경을 구축했습니다.

---

## 7. 기술 스택 (Tech Stack)

| Category         | Technologies                                                          |
| :--------------- | :-------------------------------------------------------------------- |
| **Language**     | Java 17, Python 3.9, TypeScript                                       |
| **Framework**    | Spring Boot 3.4, Flask, React 18                                      |
| **Database**     | MariaDB                                                               |
| **State Mgmt**   | Zustand                                                               |
| **Infra/DevOps** | Docker, Docker Compose, Prometheus, Grafana                           |
| **AI/ML**        | OpenAI GPT-4 / DALL-E 3, HuggingFace SDXL, XLM-RoBERTa, KeyBERT, Kiwi |
| **Security**     | Spring Security, JWT, BCryptPasswordEncoder                           |

---

## 8. 트러블슈팅 (Troubleshooting)

### 🔴 문제 1: JSON 직렬화 오류 — Lombok `@Data` + JPA 양방향 관계

**원인**

`User` Entity에 `@Data`를 사용했을 때, `User ↔ Child` 양방향 연관관계에서 `toString()` 및 Jackson 직렬화 시 **순환 참조(Circular Reference)** 발생.

```
// 문제 상황: @Data가 생성한 toString()이 child → user → child → ... 무한 호출
@Data  // ❌ toString(), equals(), hashCode() 모두 자동 생성 → 순환 참조
@Entity
public class User {
    @OneToOne(mappedBy = "user")
    private Child child;  // child.toString() → user.toString() → 무한 루프
}
```

**해결**

`@Data` 대신 필요한 어노테이션만 명시적으로 분리하고, `toString()`을 직접 오버라이드하여 연관 객체를 제외.

```java
// ✅ 해결: @Data 제거, 필요한 것만 명시
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User implements UserDetails {

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Child child;

    // toString()에서 child 제외 → 순환 참조 차단
    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', email='" + email + "'}";
    }
}
```

**교훈**: JPA 양방향 연관관계가 있는 Entity에는 `@Data` 사용을 지양하고, `@Getter`/`@Setter`/`@Builder`를 개별 적용하며 `toString()`은 연관 객체를 포함하지 않도록 명시적으로 작성한다.

---

### 🔴 문제 2: CORS 오류 — face-api 서비스 연동

**원인**

Python Flask 서버(`face-api`)에 CORS 설정이 없어 브라우저에서 직접 호출 시 차단.

**해결**

```python
# app.py
from flask_cors import CORS
CORS(app, resources={r"/*": {"origins": "*"}})  # 개발 환경: 전체 허용
```

Spring Boot에서 `RestTemplate`으로 서버 간 통신으로 전환하여 브라우저 CORS 문제를 우회.

---

### 🔴 문제 3: AI 이미지 생성 병목 — 메인 서버 스레드 차단

**원인**

DALL-E / HuggingFace API 응답 대기 시간(수 초~수십 초)이 Spring Boot 메인 스레드를 점유하여 다른 요청 처리 불가.

**해결**

AI 로직을 별도 Python 마이크로서비스(`face-api`)로 완전 분리. Spring Boot는 요청을 중계하는 역할만 담당하여 메인 서버의 응답성 유지.

---

## 9. 문제 해결 및 성과 (Key Achievements)

- **AI 파이프라인 완성**: 일기 텍스트 → 감정 분석 → 키워드 추출 → 프롬프트 생성 → 이미지 생성까지 End-to-End 자동화
- **Polyglot Architecture**: Java(안정성/보안)와 Python(AI/ML)의 장점을 결합한 Hybrid 서비스 구조 설계
- **보안 강화**: JWT 인증, BCrypt 암호화, 소유자 검증, User Enumeration Attack 방지 패턴 적용
- **Zustand 도입**: 로컬 상태와 전역 상태를 정리하여 코드 복잡도 감소 및 유지보수성 향상
