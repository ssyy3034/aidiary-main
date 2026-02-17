# 📂 Project: Aidiary

> **"Java의 안정성과 Python의 확장성을 결합한 멀티모달 AI 육아 플랫폼"**

## 1. 프로젝트 개요 (Overview)

- **서비스명**: Aidiary (AI 산모 일기)
- **개발 인원**: 1인 (Full Stack)
- **프로젝트 성격**: Spring Boot와 Python AI 서비스를 연동한 **Polyglot & Hybrid Architecture** 프로젝트
- **핵심 기능**:
  - 부모 사진 기반 2세 얼굴 예측 (Face Analysis + Generative AI)
  - 성격/맥락 기반 AI 페르소나 챗봇 (Context-Aware Chat)
  - 육아 일기 및 성장 기록 관리

---

## 2. 핵심 아키텍처 및 차별점 (Key Highlights)

### 🏗 1. Hybrid AI Service Architecture

단일 언어의 한계를 극복하기 위해 **"적재적소(Right Tool for the Right Job)"** 원칙을 적용하여 아키텍처를 설계했습니다.

- **Spring Boot**: 복잡한 비즈니스 로직, 데이터 무결성 보장(Transactional), 보안(Security) 담당.
- **Python (Flask)**: Face Analysis, Image Generation 등 AI/ML 라이브러리 활용에 특화된 서비스 담당.
- **Inter-service Communication**: `RestTemplate`을 사용해 두 서비스 간의 통신 파이프라인을 구축하고, 무거운 AI 연산을 분리하여 메인 서버의 안정성을 확보했습니다.

### 🧠 2. End-to-End AI Pipeline

단순 API 호출이 아닌, **데이터 전처리부터 생성까지 이어지는 완전한 파이프라인**을 구현했습니다.

1.  **Input**: 사용자 업로드 이미지 (부모 사진)
2.  **Preprocessing**: `face-cli`를 이용한 얼굴 특징점(눈, 코, 입, 얼굴형) 정밀 추출
3.  **Prompt Engineering**: 추출된 특징을 기반으로 DALL-E 3에 최적화된 프롬프트 자동 생성 (Prompt Generator)
4.  **Generation & Response**: 최종 결과물 생성 및 클라이언트 반환

---

## 3. 기술적 역량 상세 (Technical Skills)

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

## 4. 기술 스택 (Tech Stack)

| Category         | Technologies                                      |
| :--------------- | :------------------------------------------------ |
| **Language**     | Java 17, Python 3.9, TypeScript                   |
| **Framework**    | Spring Boot 3.4, Flask, React 18                  |
| **Database**     | MariaDB                                           |
| **State Mgmt**   | Zustand                                           |
| **Infra/DevOps** | Docker, Docker Compose, Prometheus, Grafana       |
| **AI/ML**        | OpenAI API (DALL-E 3), AILab Tools, Face Analysis |

---

## 5. 문제 해결 및 성과 (Key Achievements)

- **⚠️ 문제**: AI 이미지 생성 시 긴 대기 시간으로 인해 메인 서버 스레드가 차단되는 병목 현상 발생
- **✅ 해결**: AI 로직을 별도 Python 마이크로서비스로 분리하고, 비동기 처리가 용이한 구조로 리팩토링하여 메인 서버의 응답성을 유지함.
- **⚠️ 문제**: 프론트엔드에서 다수의 상태 관리로 인한 코드 복잡도 증가
- **✅ 해결**: 로컬 상태(`useState`)와 중복되는 전역 상태를 정리하고, **Zustand** 스토어 기반으로 일원화하여 코드 라인 수 단축 및 유지보수성 향상.
