# 🍼 AiDiary — AI 산모일기

> 임신부터 출산까지, AI가 함께하는 특별한 육아 다이어리

AiDiary는 **임산부와 초보 부모**를 위한 올인원 다이어리 서비스입니다.
일기를 쓰면 AI가 감정을 분석하고 아이의 모습을 그려주며, 나만의 캐릭터와 대화할 수 있습니다.

🔗 **서비스**: [https://aidiary.shop](https://aidiary.shop)

---

## 📑 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
- [테스트](#-테스트)
- [기여 방법](#-기여-방법)
- [프로젝트 상태 및 로드맵](#-프로젝트-상태-및-로드맵)
- [저자](#-저자)
- [라이선스](#-라이선스)

---

## ✨ 주요 기능

### AI 감정 일기
일기를 작성하면 AI가 **감정을 분석**(XLM-RoBERTa)하고, **키워드를 추출**(Kiwi + KeyBERT)하여
그날의 감정에 맞는 **일러스트를 자동 생성**(DALL-E 3)합니다.

### 캐릭터 챗봇
부모의 얼굴 사진을 분석해 **아이 캐릭터**를 만들고,
성격 테스트 기반 페르소나가 부여된 **AI 챗봇**과 대화할 수 있습니다.
LangGraph 기반 RAG로 임신·육아 관련 질문에도 정확하게 답변합니다.

### 건강 대시보드
임신 **주차별 정보**, **태동 기록**, **혈압·체중 추적**, **진통 타이머**를
한 화면에서 관리할 수 있습니다.

### 임신 혜택 체크리스트
받을 수 있는 보조금·지원금을 한눈에 확인하고 체크할 수 있습니다.

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Java 17, Spring Boot 3.4, Spring Security, JPA, JWT |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| **AI / ML** | Flask, XLM-RoBERTa, KeyBERT, DALL-E 3, LangGraph, ChromaDB |
| **Database** | MariaDB 11, Redis (캐싱), RabbitMQ (비동기 큐) |
| **Infra** | AWS (EC2, S3, RDS, CloudFront, Route 53), Docker Compose |
| **Monitoring** | Prometheus, Grafana |

---

## 🏗 시스템 아키텍처

```
                            🌐 사용자
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Route 53 (DNS)    │
                    │   aidiary.shop      │
                    └────────┬────────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │ CloudFront (CDN)    │
                    │ SSL/TLS · WAF 보호  │
                    └───────┬─────┬───────┘
                            │     │
                   ┌────────┘     └────────┐
                   ▼                       ▼
          ┌────────────────┐      ┌────────────────┐
          │  S3 Bucket     │      │  EC2 (t3.small)│
          │  정적 프론트엔드│      │  백엔드 API    │
          └────────────────┘      └───────┬────────┘
                                          │
                         ┌────────┬───────┼───────┐
                         ▼        ▼       ▼       ▼
                      MariaDB   Redis  RabbitMQ  Flask
                     (RDS 11.8) (캐싱) (작업 큐) (AI 서버)
                      db.t4g     :6379            :5001
                      .micro                       │
                       20GB               ┌────────┴────────┐
                      (암호화)            ▼                 ▼
                                     OpenAI API       HuggingFace
                                   (GPT-4, DALL-E)   (감정 분석)
```

---

## 🚀 설치 및 실행

### 사전 요구사항

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- MariaDB 11+ (또는 Docker로 자동 실행)
- Redis

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 실제 값으로 수정합니다:

| 변수 | 설명 |
|------|------|
| `DB_URL` | MariaDB 연결 URL |
| `DB_USERNAME` / `DB_PASSWORD` | DB 인증 정보 |
| `JWT_SECRET` | JWT 시크릿 키 (64자 이상) |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `AILAB_API_KEY` | AILab 얼굴 분석 API 키 |

### 2-A. Docker로 실행 (권장)

```bash
docker-compose up -d
```

모든 서비스가 한 번에 실행됩니다:

| 서비스 | 포트 |
|--------|------|
| Spring Boot 앱 | `8080` |
| Flask AI 서버 | `5001` |
| MariaDB | `3307` |
| Redis | `6379` |
| Grafana 대시보드 | `3000` |
| Prometheus | `9090` |

### 2-B. 로컬 개발 환경

**백엔드**:
```bash
./gradlew bootRun
```

**프론트엔드** (별도 터미널):
```bash
cd aidiary
npm install
npm start    # http://localhost:3000 → 프록시 → :8080
```

**AI 서버** (별도 터미널):
```bash
cd faceapi
pip install -r requirements.txt
python app.py    # http://localhost:5001
```

---

## 🧪 테스트

```bash
# 백엔드 단위 테스트
./gradlew test

# 프론트엔드 테스트
cd aidiary && npm test

# TypeScript 타입 검사
cd aidiary && npx tsc --noEmit
```

---

### 커밋 컨벤션

| 접두사 | 용도 |
|--------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드·설정 변경 |

---

## 📍 프로젝트 상태 및 로드맵

**현재 상태**: 🟡 Beta
**개발 기간**: 2025.04 ~ 2025.06

### 완료
- [x] JWT 인증 및 회원 관리
- [x] 일기 CRUD + AI 감정 분석 + 일러스트 생성
- [x] 캐릭터 생성 및 LangGraph 기반 AI 챗봇
- [x] 건강 대시보드 (태동, 혈압, 체중, 진통 타이머)
- [x] 임신 혜택 체크리스트
- [x] Docker Compose 배포 + AWS 인프라 구축
- [x] Prometheus + Grafana 모니터링

### 향후 계획
- [ ] 소셜 로그인 (카카오, 네이버)
- [ ] 일기 공유 및 가족 초대 기능
- [ ] 푸시 알림 (검진 일정, 태동 기록 리마인더)
- [ ] 다국어 지원

---

## 👥 저자

| 이름 | 역할 | GitHub |
|------|------|--------|
| 권동하 | 풀스택 개발 | [@dongha](https://github.com/dongha) |

---

## 📄 라이선스

이 프로젝트는 **MIT License**로 배포됩니다.
자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.
