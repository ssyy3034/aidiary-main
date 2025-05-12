# Aidiary 프로젝트

## 프로젝트 개요
Aidiary는 산모의 정서 관리와 가족 유대 형성을 지원하는 AI 기반 일기 서비스입니다.
주요 목표는 감정 기반 일기 작성, AI 조언 제공, 부모의 얼굴과 초음파 정보를 기반으로 한 아이 캐릭터 생성 및 정서적 상호작용을 통해 임신 중 산모의 정서적 안정과 가족 유대 강화를 돕는 것입니다.

## 주요 기능
- 회원가입 및 로그인 (JWT 기반 인증)
- 사용자 정보 조회, 수정, 삭제 (CRUD)
- 감정 기반 일기 작성 및 감정 분석
- AI 조언 제공
- 얼굴, 초음파 이미지 업로드 및 AI 캐릭터 생성
- 캐릭터와 정서적 상호작용

## 기술 스택
- 백엔드: Java, Spring Boot, JPA, Hibernate
- 데이터베이스: MariaDB
- 프론트엔드: React, Vite, Axios
- AI: OpenAI API 사용
- 인증: JWT
- 배포: Docker, EC2

## 프로젝트 구조
```
Aidiary/
├── src/
│   ├── main/
│   │   ├── java/org/aidiary/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── entity/
│   │   │   ├── dto/
│   │   │   ├── config/
│   │   └── resources/
├── docker/
├── scripts/
└── README.md
```

## API 명세
- `/api/v1/auth/register`: 회원가입
- `/api/v1/auth/login`: 로그인
- `/api/v1/user/info`: 사용자 정보 조회
- `/api/v1/user/update`: 사용자 정보 수정
- `/api/v1/user/delete`: 회원 탈퇴
- `/api/v1/file/upload`: 파일 업로드

## 실행 방법
1. Docker Compose로 서버 실행
2. Postman으로 API 테스트

## 개발 일정
- 1~2주차: 요구사항 분석 및 회원가입/로그인 구현
- 3~4주차: 감정 분석 일기 작성 및 캐릭터 생성
- 5~6주차: AI 조언 기능 및 상호작용 구현
- 7주차: 통합 테스트 및 배포

