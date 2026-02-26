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

### k6 부하 테스트 결과 (Before: @Async)

| 지표                | 10 VU  | 40 VU  | 80 VU       | 120 VU      |
| ------------------- | ------ | ------ | ----------- | ----------- |
| 성공률              | 100%   | 100%   | 임계점 도달 | Tomcat 압박 |
| 응답시간 p95        | ~100ms | ~500ms | 수 초       | > 30s       |
| Tomcat busy threads | 5-10   | 40+    | 150+        | 200 (Max)   |

> 35건(Pool 10 + Queue 25) 초과 시 **CallerRunsPolicy**가 발동하여 Tomcat 스레드가 직접 Flask를 호출, 서비스 전체가 마비됨.

### k6 부하 테스트 결과 (After: RabbitMQ)

| 지표                | 10 VU     | 40 VU     | 80 VU     | 120 VU    |
| ------------------- | --------- | --------- | --------- | --------- |
| 성공률              | 100%      | 100%      | 100%      | 100%      |
| 응답시간 p95        | **1.2ms** | **2.5ms** | **3.8ms** | **4.7ms** |
| Tomcat busy threads | 2-3       | 5-7       | 10-12     | 15-20     |

#### 부하 분산 증거 (RabbitMQ Status)

```bash
# 120 VU 테스트 도중 큐 상태 (10개 Consumer 가동 중)
name              messages_ready  messages_unacknowledged  consumers
image-processing  0               609                      10
```

- **Unacknowledged(609)**: Tomcat 스레드는 즉시 반환되었고, 609개의 작업이 독립된 Consumer 스레드에 의해 안전하게 줄지어 처리 대기 중.
- **Tomcat 안정성**: 응답시간이 **30초 → 5ms 미만**으로 획기적으로 개선되었으며, Tomcat 스레드는 평상시 수준을 유지.

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
