# 비동기 이미지 처리 아키텍처 개선: @Async → RabbitMQ

## 1. 배경

부모 사진 합성 기능은 Python 기반의 `face-api` 컨테이너(MediaPipe 분석 + 유전학 블렌딩 + Gemini API 호출)를 거치는 무거운 ML 파이프라인으로, 단일 요청 처리에도 수 초가 소요되며 트래픽이 몰릴 경우 자원 경합으로 인해 처리 시간이 **30초 이상**으로 급증하거나 서버가 타임아웃되는 근본적인 병목을 가지고 있었습니다.
이를 비동기로 처리하기 위해 초기에는 `@Async` + `ThreadPoolTaskExecutor`를 도입했으나, 부하 테스트에서 구조적 한계가 드러났습니다.

## 2. 현재 아키텍처 (@Async + ThreadPool)

```
[클라이언트] → POST /api/images/analyze
                    ↓
[Tomcat 스레드] → imageTaskExecutor.submit(task) → [ThreadPool: max 10, queue 25]
                    ↓                                        ↓
            202 Accepted + jobId                   → Flask API 호출 (30s)
                    ↓                                        ↓
[클라이언트] → GET /status/{jobId} (polling)         ImageJobStore에 결과 저장
```

### Thread Pool 설정

```java
executor.setCorePoolSize(5);
executor.setMaxPoolSize(10);
executor.setQueueCapacity(25);
executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
```

### 문제점: CallerRunsPolicy의 함정

Queue(25) + Pool(10) = 35건 초과 시, **CallerRunsPolicy**에 의해 Tomcat 스레드가 직접 Flask를 호출한다.

```
동시 40건 이상 → Tomcat 스레드가 Flask 호출(30s) 직접 처리
              → Tomcat 스레드 점유 → 다른 API 응답 불가
              → 서비스 전체 응답성 저하
```

### 2. 성능 분석 및 임계점 검증 (Saturation Analysis)

단순한 응답 시간 비교를 넘어, 아키텍처가 버틸 수 있는 **임계점(Saturation Point)**과 **처리량 가용성(Throughput Gap)**을 심층 분석했습니다.

#### 🔍 기술적 심층 분석 (Deep Dive)

**1) Legacy: @Async의 구조적 한계 (Tight Coupling)**

- **처리량 공식**: `Max Task Pool (10) / 처리시간 (30s) = 0.33 POST/s`.
- **Saturation Point**: 초당 0.33건 이상의 요청이 지속될 경우 큐(25)는 75초 만에 가득 찹니다. 이후 `CallerRunsPolicy`가 발동하며 Tomcat 스레드가 직접 30초짜리 연산을 수행합니다.
- **연쇄 장애 (Cascading Failure)**: 200개의 Tomcat 스레드가 모두 점유되는 시점(약 1.16 TPS 지속 시)부터 서비스 전체가 마비됩니다. 분석 엔진의 지연이 API 전체의 가용성을 파괴하는 **강한 결합성**을 가졌습니다.

**2) Improved: RabbitMQ를 통한 가용성 격리 (Decoupling)**

- **처리량 이론치**: API 서버는 메시지를 큐에 밀어 넣는 데 **<1ms**만 소요합니다.
- **Capacity (Capa)**: 200개의 Tomcat 스레드가 초당 처리 가능한 이론적 유입량은 **약 850 POST/s (51,000 RPM)** 이상으로 확장되었습니다.
- **Decoupling 효과**: 분석 엔진(Consumer)이 아무리 느려져도 API 서버의 Tomcat 스레드는 즉각 반환됩니다. 초당 수백 건의 유입 요청이 들어와도 API 응답 속도는 5ms 미만을 유지하며, 부하는 안전하게 큐에서 **Backpressure** 제어를 받습니다.

#### phase 3: 최종 성능 비교 요약

| 성능 지표               | @Async (Legacy)             | RabbitMQ (Improved)         | 개선 수치            |
| :---------------------- | :-------------------------- | :-------------------------- | :------------------- |
| **최대 수용 TPS**       | **1.16 TPS** (지속 시 마비) | **850+ TPS** (이론치)       | **약 730배 확장**    |
| **60초당 처리량 (RPM)** | **69.6 RPM**                | **51,000+ RPM**             | **상용 수준 가용성** |
| **API 응답 시간 (p95)** | **30,000ms+** (포화 시)     | **4.72ms** (상시)           | **약 6,300배 단축**  |
| **시스템 영향도**       | **Strong Coupling**         | **Availability Decoupling** | **장애 전파 차단**   |

#### 📊 부하 분산 실측 데이터 (Evidence)

```bash
# 120 VU 부하 테스트 중 큐 상황 (Legacy 임계치의 16배 유입 상황)
name              messages_ready  messages_unacknowledged  consumers
image-processing  125             502                      10
```

- **Unacknowledged (502)**: 독립된 10개의 Consumer 스레드가 병렬로 작업을 수행 중이며, API 서버는 이에 영향받지 않고 5ms의 응답성을 보장함을 실측했습니다.

## 3. 개선 아키텍처 (RabbitMQ)

```
[클라이언트] → POST /api/images/analyze
                    ↓
[Tomcat 스레드] → rabbitTemplate.convertAndSend() → [RabbitMQ Queue]
                    ↓                                      ↓
            202 Accepted + jobId              [ImageConsumer @RabbitListener]
                    ↓                                      ↓
[클라이언트] → GET /status/{jobId}              → Flask API 호출 (30s)
                                                          ↓
                                               ImageJobStore에 결과 저장
```

### 핵심 변경

| 항목               | Before (@Async)        | After (RabbitMQ)                  |
| ------------------ | ---------------------- | --------------------------------- |
| 작업 위임          | `executor.submit()`    | `rabbitTemplate.convertAndSend()` |
| Tomcat 스레드 점유 | CallerRuns 시 30초     | **0초** (즉시 반환)               |
| 메시지 영속성      | ❌ 서버 재시작 시 유실 | ✅ durable queue                  |
| 실패 처리          | 로그만 남김            | DLQ (Dead Letter Queue)           |
| 재시도             | 없음                   | 3회 자동 재시도                   |
| Consumer 동시성    | ThreadPool max 10      | `concurrency="5-10"` (독립)       |

### RabbitMQ 설정

```java
// Durable Queue + Dead Letter Queue
@Bean
public Queue imageQueue() {
    return QueueBuilder.durable("image-processing")
            .withArgument("x-dead-letter-exchange", "image-exchange.dlx")
            .withArgument("x-dead-letter-routing-key", "image-processing.dlq")
            .build();
}
```

```java
// Consumer: Tomcat과 독립된 스레드에서 실행
@RabbitListener(queues = "image-processing", concurrency = "5-10")
public void consumeImageJob(ImageJobMessage message) {
    // Flask API 호출 → 결과 저장
}
```

## 4. 모니터링 인프라

### Prometheus + Grafana

```yaml
# docker-compose.prod.yml
prometheus:
  image: prom/prometheus:latest
  # Spring Boot Actuator → /actuator/prometheus 수집

grafana:
  image: grafana/grafana:latest
  # 자동 프로비저닝 대시보드 6패널
```

**Grafana 대시보드 패널:**

1. JVM Heap Memory Used
2. Tomcat Active/Busy Threads
3. Image Task Executor Pool & Queue
4. HTTP Request Rate (`/api/images/*`)
5. HTTP Response Time (p95)
6. GC Pause Time

## 5. 아키텍처 결정 근거

| 대안         | 채택 | 이유                                          |
| ------------ | ---- | --------------------------------------------- |
| RabbitMQ     | ✅   | Spring AMQP 통합, 관리 UI, DLQ, t3.small 적합 |
| Kafka        | ❌   | 이벤트 스트리밍 용도, 이 규모에 과도          |
| Redis Stream | ❌   | 메시지 보장이 약함, 전용 MQ가 더 적합         |
| AWS SQS      | ❌   | AWS 종속, 로컬 테스트 어려움                  |

### 왜 Kafka가 아닌가?

> "Kafka는 대용량 이벤트 스트리밍에 최적화되어 있지만, 우리 서비스의 이미지 처리는 분당 20건 수준의 task queue 패턴입니다. RabbitMQ는 메시지 단위 ACK, 재시도, DLQ를 간단하게 구성할 수 있어 운영 부담이 적었습니다."

## 6. 파일 변경 요약

| 파일                      | 변경                                                  |
| ------------------------- | ----------------------------------------------------- |
| `build.gradle`            | `spring-boot-starter-amqp` 추가                       |
| `RabbitMQConfig.java`     | Queue/Exchange/DLQ 선언                               |
| `ImageJobMessage.java`    | 큐 메시지 DTO                                         |
| `ImageConsumer.java`      | `@RabbitListener` consumer                            |
| `ImageService.java`       | `processViaQueue()` 추가, `processAsync()` deprecated |
| `ImageController.java`    | `processAsync` → `processViaQueue` 전환               |
| `application.properties`  | RabbitMQ 연결 + 재시도 설정                           |
| `docker-compose.prod.yml` | RabbitMQ + Prometheus + Grafana                       |

## 7. 사용 도구

- **k6 v1.0.0**: 부하 테스트 (ramping 10→120 VU)
- **Spring Boot Actuator + Micrometer**: 메트릭 수집
- **Prometheus**: 메트릭 저장 + 쿼리
- **Grafana**: 실시간 대시보드 시각화
- **RabbitMQ**: 메시지 큐 (Management UI: 15672 포트)

---

## 8. 한계점 및 향후 아키텍처 개선 과제 (Next Step)

RabbitMQ 도입을 통해 **"수십 초가 걸리는 작업을 기다리다 API 서버 전체가 마비되는 문제(Tight Coupling)"**는 해결(가용성 확보)했습니다. 하지만 큐에 쌓인 메시지를 처리하는 **Consumer(ML 파이프라인) 모델 자체가 병목**이라는 진정한 한계 지점은 남아있습니다.

무작정 값비싼 GPU/CPU 서버를 Scale-out 하는 것은 클라우드 비용 낭비로 이어지므로, **비용 효율적인 4단계 병목 해결 아키텍처**를 다음 발전 방향으로 설계했습니다.

### 단계적 구조 개선 전략 (Cost-Effective Scaling)

**1단계: 무의미한 연산의 완전한 제거 (Caching)**

- **전략**: 요청 인입 시 부모 이미지의 `Content-Hash(SHA-256)`를 생성해 비교합니다. 이미 합성해 본 부모 사진 조합이라면, 비싼 ML 서버로 메시지를 보내지 않고 과거 결과물(S3 URL 등)을 O(1)로 즉시 반환합니다.

**2단계: 부하의 우아한 제어 (Graceful Degradation)**

- **전략**: 무조건 큐에 쌓는 대신 RabbitMQ의 **Max Queue Size**를 설정합니다. 대기열이 임계치를 넘어 상식적인 대기 시간을 초과할 경우, 최전단 API에서 `429 Too Many Requests`를 반환해 "현재 접속자가 많습니다"라고 우아하게 실패(Fail Fast)시켜 인프라 비용 급증을 방지합니다.

**3단계: ML 파이프라인 소프트웨어 최적화**

- **전략**: 하드웨어 증설 전 로직을 최적화합니다. 무거운 Python 연산을 ONNX Runtime으로 변환하거나, 이미지 처리(OpenCV) 병렬화, 의존 API(Gemini) 호출 비동기화 등을 통해 단일 워커의 처리 시간(Inference Time) 자체를 획기적으로 낮춥니다.

**4단계: 영리한 스케일 아웃 (Event-Driven Auto-scaling)**

- **전략**: 위 과정을 거치고도 처리량이 부족할 때 비로소 인프라 확장을 진행합니다. 단순 상시 켬(Always-on)이 아닌, **KEDA** 등을 활용해 RabbitMQ의 `Queue Depth(큐 대기열 길이)`를 모니터링합니다. 큐가 길어질 때만 저렴한 Spot Instance 등을 띄워 Consumer를 수평 확장(Scale-out)하고, 큐가 비워지면 워커를 내리는(Scale-to-zero) 동적 운영으로 비용과 처리량을 동시에 잡습니다.
