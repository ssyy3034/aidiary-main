# 🍼 AiDiary — AI 산모일기

> 임신부터 출산까지, AI가 곁에서 함께 돕고 기록하는 특별한 육아 다이어리 🌟

**AiDiary**는 임산부와 초보 부모님들을 위해 탄생한 **올인원 다이어리 서비스**입니다.
하루의 일기를 쓰면 AI가 그날의 감정을 세심하게 분석하고, 아이의 모습을 담은 따뜻한 일러스트를 그려줍니다. 또한 나와 내 아이의 매력을 담은 나만의 캐릭터와 언제든 대화하며 궁금증을 해소할 수 있어요!

🔗 **서비스 링크**: [https://aidiary.shop](https://aidiary.shop)

---

## 📑 목차

- [✨ 주요 기능](#-주요-기능)
- [🛠 기술 스택](#-기술-스택)
- [🏗 시스템 아키텍처](#-시스템-아키텍처)
- [🚀 설치 및 실행](#-설치-및-실행)
- [🧪 테스트 및 코드 품질](#-테스트-및-코드-품질)
- [📈 프로젝트 상태 및 로드맵](#-프로젝트-상태-및-로드맵)
- [👥 팀원 및 저자](#-팀원-및-저자)
- [📄 라이선스](#-라이선스)

---

## ✨ 주요 기능

### 📝 1. AI 감정 일기 & 맞춤 일러스트

- 일기를 작성하면 내부 AI 모델(XLM-RoBERTa + KeyBERT)이 **감정과 핵심 키워드를 자동 분석**합니다.
- 분석된 감정에 어울리는 **따뜻한 일러스트(DALL-E 3)를 생성**하여 일상의 기록을 더욱 특별하게 만들어줍니다.

### 👶 2. 우리 아이 캐릭터 챗봇

- 부모의 얼굴을 분석해 세상에 하나뿐인 **아이 캐릭터**를 만들어줍니다.
- 성격 테스트를 통해 페르소나를 부여받은 **AI 챗봇**과 실시간으로 대화해 보세요.
- **LangGraph 기반 RAG(검색 증강 생성)** 기술이 적용되어 임신·육아 관련 질문에도 척척 정확하게 답해줍니다.

### 🩺 3. 올인원 건강 대시보드

- 임신 **주차별 필수 정보**를 한눈에 볼 수 있습니다.
- **태동 기록, 혈압/체중 추적, 진통 타이머** 등 흩어져 있던 건강 기록을 하나의 앱에서 간편하게 관리하세요.

### 🎁 4. 놓치기 쉬운 혜택 체크리스트

- 내가 받을 수 있는 **보조금과 지원금 혜택 목록**을 한눈에 확인하고 체크하며 챙길 수 있습니다. (구현 완료: `BenefitsChecklist.tsx`)

---

## 🛠 기술 스택

| 영역               | 사용 기술                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Backend**        | Java 17, Spring Boot 3.4, Spring Security, JPA, JWT                                       |
| **Frontend**       | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand                                |
| **AI / Data**      | Python(Flask, Celery/Worker), XLM-RoBERTa, KeyBERT, DALL-E 3, Gemini, LangGraph, ChromaDB |
| **Database**       | MariaDB 11, Redis (캐싱 및 락), RabbitMQ (비동기 메시지 큐)                               |
| **Infrastructure** | AWS (EC2), Docker Compose                                                                 |
| **Monitoring**     | Prometheus, Grafana                                                                       |

---

## 🏗 시스템 아키텍처 및 인프라 및 네트워크 스펙

**☁️ 핵심 AWS 인프라 및 네트워크**

- **Domain & DNS**: 가비아(Gabia)에서 도메인 구매 후 **AWS Route 53**을 통해 관리.
  - **도메인 라우팅(Domain Routing)**: 정적 리소스 요청은 S3/CF로, API 요청은 EC2 서버로 분기 처리.
- **Frontend Hosting**: **AWS S3 + CloudFront** (정적 호스팅 및 전역 CDN 서빙)
- **Main Backend**: AWS EC2 (`t3.small` - 2vCPU, 2GB RAM)
  - *Spring Boot + Flask + Redis + RabbitMQ*가 Docker Compose로 유기적으로 운영됩니다.
- **Managed Database**: **AWS RDS MariaDB 11.8** (`db.t4g.micro`)
- **Storage Strategy**:
  - **Local EBS (Docker Volumes)**: 일반 파일(`/uploads/`) 및 내부 데이터 저장
  - **In-Memory Store**: AI 생성 이미지 (10분 TTL 임시 보관 후 자동 삭제)

**⚙️ 기술적 구현**

- **라우팅 최적화**: 클라이언트 요청 성격에 따라 S3/CF와 EC2로 분산 처리하여 서버 부하를 최소화했습니다.
- **비동기 AI 파이프라인**: RabbitMQ 메시지 큐를 활용하여 무거운 감정 분석 및 이미지 생성 작업을 백그라운드에서 배칭 처리합니다.
- **중앙 집중식 로직**: 비즈니스 로직 및 AI 연동 연산은 Spring Boot 백엔드에서 통합 관리됩니다.

### 🖼 시스템 아키텍처 다이어그램

```mermaid
architecture-beta
    group aws(cloud)[AWS Cloud]
    group ec2(server)[EC2 - t3.small] in aws
    group docker(system)[Docker Compose] in ec2
    
    service cf(internet)[CloudFront\n(SSL/TLS 1.2)] in aws
    service s3(server)[Amazon S3\n(SPA React)] in aws
    service rds(database)[RDS\n(MariaDB 11.8)] in aws
    
    service spring(server)[Spring Boot\n(Main API Server)] in docker
    service flask(server)[Flask AI Service\n(Worker: 5000/8000)] in docker
    service rabbitmq(server)[RabbitMQ\n(Message Queue)] in docker
    service redis(database)[Redis\n(Cache & Lock)] in docker
    service monitoring(server)[Prometheus\n+ Grafana] in docker
    
    service ext_ai(internet)[External LLMs\n(OpenAI, Gemini)]
    
    cf:B --> T:s3
    cf:B --> T:spring
    cf:R --> L:flask
    
    spring:L --> R:rds
    spring:R --> L:redis
    spring:B --> T:rabbitmq
    
    rabbitmq:R --> L:flask
    flask:R --> L:ext_ai
    flask:T --> B:spring
    
    monitoring:T --> B:redis
    monitoring:T --> B:spring
```

![System Architecture](./docs/architecture.png)

---

## 🚀 설치 및 실행

### 📋 사전 요구사항

- Java 17 이상
- Node.js 18 이상
- Docker 및 Docker Compose (가장 권장되는 실행 방식)

### 1️⃣ 환경 변수 설정

프로젝트 루트 폴더에서 예제 파일을 복사하여 설정을 준비합니다.

```bash
cp .env.example .env
```

복사한 `.env` 파일을 열고 본인의 환경에 맞게 값을 채워 넣어주세요:

| 환경 변수                     | 설명 및 용도                                                     |
| ----------------------------- | ---------------------------------------------------------------- |
| `DB_URL`                      | 데이터베이스 연결 URL (예: jdbc:mariadb://mariadb:3306/ai_diary) |
| `DB_USERNAME` / `DB_PASSWORD` | 데이터베이스 인증 정보                                           |
| `JWT_SECRET`                  | 보안을 위한 JWT 시크릿 키 (64자 이상 랜덤 문자열)                |
| `OPENAI_API_KEY`              | OpenAI 연동을 위한 API 키                                        |
| `GEMINI_API_KEY`              | Gemini 연동 등에 사용되는 API 키                                 |

### 2️⃣-A. Docker를 활용한 원클릭 실행 (강력 추천! ⭐️)

모든 데이터베이스와 백엔드 서비스를 한 번에 띄울 수 있습니다.

```bash
docker-compose up -d
```

| 서비스               | 활성화 포트 |
| -------------------- | ----------- |
| **Spring Boot 앱**   | `:8080`     |
| **Flask AI 서버**    | `:5001`     |
| **MariaDB**          | `:3307`     |
| **Redis**            | `:6379`     |
| **Grafana 대시보드** | `:3000`     |
| **Prometheus**       | `:9090`     |

### 2️⃣-B. 로컬 개발 환경 직접 실행 (개발자용)

코드를 수정하며 실시간으로 반영하고 싶을 때는 각 파트를 개별 실행합니다.

**1. 백엔드 (Spring Boot)**

```bash
./gradlew bootRun
```

**2. 프론트엔드 (React)** - 별도의 터미널을 열어주세요.

```bash
cd aidiary
npm install
npm start    # http://localhost:3000 에서 확인 가능
```

**3. AI 서버 (Flask)** - 별도의 터미널을 열어주세요.

```bash
cd faceapi
pip install -r requirements.txt
python app.py    # http://localhost:5001 에서 확인 가능
```

---

## 🧪 테스트 및 코드 품질

안정성 있는 프로덕트를 만들어가기 위해 테스트를 수시로 진행해 주세요!

```bash
# 백엔드: 단위/통합 테스트 실행
./gradlew test

# 프론트엔드: React 컴포넌트 테스트
cd aidiary && npm test

# 프론트엔드: TypeScript 타입 무결성 검사
cd aidiary && npx tsc --noEmit
```

### 💡 커밋 컨벤션 가이드

깔끔한 히스토리 관리를 위해 커밋 메시지는 다음과 같은 머릿말을 사용합니다.

- `feat`: 🌟 새로운 기능 추가
- `fix`: 🐛 버그 수정
- `docs`: 📖 문서 수정 및 추가
- `refactor`: ♻️ 코드 리팩토링 (기능 변화 없음)
- `test`: 🧪 테스트 코드 추가 및 수정
- `chore`: 🔧 빌드, 설정, 라이브러리 변경 등

---

## 📈 프로젝트 상태 및 로드맵

**현재 릴리스 상태**: 🟡 Beta 버전
**진행 기간**: 2024.04 ~ 지속 업데이트 중

### ✅ 완료 내역

- [x] JWT 기반의 안전한 인증 및 회원 관리
- [x] 다이어리 CRUD, AI 감정 분석, 맞춤 일러스트 생성 파이프라인 구축
- [x] 사용자 사진 분석 캐릭터 생성 및 LangGraph 기반 RAG 챗봇
- [x] 임산부를 위한 건강 대시보드 (진통 타이머, 태동 기록 등)
- [x] RabbitMQ를 통한 이미지 생성 비동기 구조 개선으로 응답성 확보
- [x] Docker Compose를 이용한 원활한 인프라 배포 (AWS 연동)
- [x] Prometheus + Grafana 모니터링 체계 구축 강화

### 🔜 향후 계획

- [ ] 소셜 간편 로그인 (카카오, 네이버)
- [ ] 작성한 일기 공유 및 가족/남편 초대 공동 관리 기능
- [ ] 필수 건강 검진 및 태동 일정 스마트 푸시 알림
- [ ] 다국어(글로벌) 지원 준비

---

## 👥 팀원 및 저자

| 이름       | 역할 구분                          | GitHub 링크                          |
| ---------- | ---------------------------------- | ------------------------------------ |
| **권동하** | 풀스택 개발 및 인프라/AI 연동 전반 | [@dongha](https://github.com/dongha) |

---

## 📄 라이선스

이 프로젝트는 **MIT License**를 따릅니다.
무료 배포 및 수정이 가능합니다. 자세한 내용은 [`LICENSE`](./LICENSE) 파일을 확인하세요.
