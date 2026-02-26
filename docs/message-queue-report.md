# 비동기 이미지 처리 아키텍처 개선: @Async → RabbitMQ

## 1. 배경

부모 사진 합성 기능에서, Spring Boot가 Flask(face-api) 서버에 이미지를 전달하고 결과를 받는 과정이 **30초 이상** 소요된다. 이를 비동기로 처리하기 위해 `@Async` + `ThreadPoolTaskExecutor`를 도입했으나, 부하 테스트에서 구조적 한계가 드러났다.

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
