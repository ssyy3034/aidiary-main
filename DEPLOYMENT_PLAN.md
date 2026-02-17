# 🚀 AI Diary 배포 계획서

## 1. 아키텍처 개요

```
[S3 + CloudFront]  →  [API Gateway]  →  [Lambda (Docker)]
   React PWA              라우팅          Python + AI 모델
                                         (감정분석/키워드/DALL-E)

[EC2 t3.micro]  →  [RDS t3.micro]
  Spring Boot          MySQL
```

### 서비스 특성

- **일기 앱**: 하루 1~2회 작성, 주로 저녁~밤 시간대
- **AI 호출 빈도**: 매우 낮음 (일기 작성 시에만)
- **DALL-E 응답 시간**: 10~15초 (콜드 스타트 5초는 체감 미미)

→ **상시 서버보다 서버리스(Lambda)가 비용 효율적**

---

## 2. AWS 서비스 구성

| 컴포넌트       | AWS 서비스             | 역할                            | 월 비용       |
| :------------- | :--------------------- | :------------------------------ | :------------ |
| Frontend (PWA) | S3 + CloudFront        | 정적 호스팅 + CDN               | ~$1           |
| API Gateway    | API Gateway            | HTTP 라우팅                     | 무료 티어     |
| AI Server      | **Lambda (Container)** | 감정분석 + 키워드 + 이미지 생성 | ~$0~3         |
| Main API       | EC2 t3.micro           | Spring Boot                     | 프리티어 무료 |
| Database       | RDS t3.micro           | MySQL                           | 프리티어 무료 |
| Model Storage  | ECR                    | Docker 이미지 저장              | ~$1           |

**총 예상 비용: 월 $2~5 (프리티어 활용 시)**

---

## 3. Lambda 컨테이너 배포 전략

### 3-1. Dockerfile 최적화

```dockerfile
# Multi-stage build로 이미지 최소화
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 모델을 이미지에 Bake (콜드 스타트 시 다운로드 방지)
RUN python -c "
from transformers import AutoTokenizer, AutoModelForSequenceClassification
AutoTokenizer.from_pretrained('beomi/KcELECTRA-base')
AutoModelForSequenceClassification.from_pretrained('beomi/KcELECTRA-base')
"

FROM python:3.11-slim
COPY --from=builder /app /app
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface
COPY . /app
WORKDIR /app

CMD ["python", "-m", "awslambdaric", "lambda_handler.handler"]
```

### 3-2. 콜드 스타트 최적화

| 방법                           | 효과                         |
| :----------------------------- | :--------------------------- |
| 모델 Docker Bake               | 다운로드 0초                 |
| ONNX 양자화                    | 모델 크기 1/4, 로딩 속도 2배 |
| Lambda 메모리 2048MB+          | CPU 할당 증가 → 로딩 가속    |
| Provisioned Concurrency (유료) | 콜드 스타트 완전 제거        |

**예상 콜드 스타트: ~5초** (DALL-E 10~15초 대비 체감 미미)

---

## 4. CI/CD 파이프라인

```yaml
# .github/workflows/deploy-ai.yml
name: Deploy AI Server
on:
  push:
    branches: [main]
    paths: ["faceapi/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
      - name: Build & Push Docker Image
        run: |
          docker build -t ai-diary-ai ./faceapi
          docker tag ai-diary-ai:latest $ECR_URI:latest
          docker push $ECR_URI:latest
      - name: Update Lambda
        run: |
          aws lambda update-function-code \
            --function-name ai-diary-ai \
            --image-uri $ECR_URI:latest
```

---

## 5. 트래픽 증가 시 마이그레이션 전략

```
Phase 1 (현재)     Phase 2 (DAU 100+)     Phase 3 (DAU 1000+)
─────────────     ──────────────────     ───────────────────
Lambda            ECS Fargate            ECS + Auto Scaling
 $2~5/월           $15~30/월              $50~100/월
 콜드스타트 5초     상시 실행               로드밸런서 추가
```

### 전환 기준

- **Lambda → ECS Fargate**: 월 Lambda 호출 > 10만 건, 또는 콜드 스타트 UX 불만 발생 시
- **Fargate → EC2 ECS**: 예측 가능한 트래픽 패턴이 확인되면 Reserved Instance로 비용 절감

### 전환 난이도: ⭐ 쉬움

Docker 이미지가 동일하므로, Lambda에서 ECS로의 전환은 **인프라 설정만 변경**하면 됨. 코드 수정 불필요.

---

## 6. 체크리스트

- [ ] 로컬 AI 파이프라인 테스트 완료
- [ ] Dockerfile 최적화 (모델 Bake + Multi-stage)
- [ ] AWS 계정 설정 (IAM, ECR, Lambda)
- [ ] Lambda 컨테이너 배포
- [ ] API Gateway 연결
- [ ] Spring Boot → Lambda 연동 확인
- [ ] S3 + CloudFront로 PWA 배포
- [ ] 도메인 연결 (Route 53, Optional)
