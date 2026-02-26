# 비동기 이미지 처리 파이프라인 메모리 누수 분석 및 해결

## 1. 배경

얼굴 합성 기능은 사용자가 부모 사진 2장을 업로드하면 Flask(face-api) 서버에서 AI 분석 후 합성 이미지를 반환하는 구조다. 초기에는 Spring Boot가 Flask 응답을 **동기 방식**으로 기다렸으나, Flask 처리 시간이 30초 이상 소요되면서 HTTP 타임아웃과 스레드 고갈 문제가 발생했다.

이를 해결하기 위해 **비동기 Job Queue 패턴**을 도입했다:

```
[프론트엔드] → POST /api/images/analyze → [Spring Boot] → @Async → [Flask]
         ← 202 Accepted + jobId ←
         → GET /api/images/status/{jobId} (polling)
         ← { "status": "DONE" }
         → GET /api/images/result/{jobId}
         ← image/png byte[]
```

Job 상태와 결과를 서버 메모리(`ConcurrentHashMap`)에 저장하는 `ImageJobStore`를 구현했다.

## 2. 문제 발견

### 2.1 k6 부하 테스트로 이상 탐지

k6로 동시 5 VU × 30초 부하 테스트를 실행하면서, Spring Boot Actuator의 JVM 힙 메트릭을 모니터링했다.

```bash
# k6 부하 테스트 실행
k6 run --env BASE_URL=http://localhost:8080 k6-image-job-leak-test.js

# 병렬로 힙 모니터링
bash k6-heap-monitor.sh http://localhost:8080 60
```

**k6 테스트 결과:**

```
scenarios: 5 looping VUs for 30s
iterations: 50 (1.48/s)
http_req_duration: avg=29.8ms, p(95)=110.15ms
checks: 100.00% ✓ (Job 제출 성공 + jobId 반환)
```

### 2.2 Actuator 힙 메트릭 분석

`/actuator/metrics/jvm.memory.used?tag=area:heap` 엔드포인트에서 힙 사용량을 확인한 결과, **요청이 종료된 후에도 힙이 완전히 반환되지 않는 패턴**을 발견했다.

## 3. 원인 분석

### 3.1 `ImageJobStore`의 Strong Reference 문제

```java
@Component
public class ImageJobStore {
    // ⚠️ 완료된 Job의 byte[]가 무기한 누적됨
    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();

    public record JobResult(Status status, byte[] imageBytes, String errorMessage) {}

    public void complete(String jobId, byte[] imageBytes) {
        store.put(jobId, new JobResult(Status.DONE, imageBytes, null));
        // imageBytes(수백KB~수MB)가 Map에 strong reference로 유지됨
        // → GC가 수집할 수 없음
    }
}
```

**근본 원인:**

- `ConcurrentHashMap`의 value에 `byte[]` (이미지 데이터)가 **strong reference**로 유지됨
- 클라이언트가 결과를 가져간 후에도 Map에서 제거하는 로직이 없음
- 서버 재시작 전까지 Job이 무한히 누적 → **힙 소진**

### 3.2 프론트엔드 무한 폴링 위험

```typescript
// ⚠️ 서버가 응답하지 않으면 무한 루프
while (!done) {
  await new Promise((r) => setTimeout(r, 3000));
  const statusRes = await imageApi.getStatus(jobId);
  // ...
}
```

## 4. 해결

### 4.1 TTL 기반 자동 정리 (`@Scheduled`)

```java
@Slf4j
@Component
public class ImageJobStore {

    public record JobResult(Status status, byte[] imageBytes,
                            String errorMessage, Instant createdAt) {}

    private static final long TTL_MINUTES = 10;
    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();

    /**
     * 1분마다 실행: TTL 초과 Job을 제거하여 GC가 byte[]를 수집할 수 있게 한다.
     */
    @Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds(TTL_MINUTES * 60);
        int beforeSize = store.size();

        store.entrySet().removeIf(entry ->
                entry.getValue().createdAt().isBefore(cutoff)
        );

        int removed = beforeSize - store.size();
        if (removed > 0) {
            log.info("ImageJobStore cleanup: {}개 만료 Job 제거 (남은 Job: {}개)",
                     removed, store.size());
        }
    }
}
```

### 4.2 프론트엔드 폴링 타임아웃

```typescript
const MAX_POLLS = 40; // 3초 × 40 = 최대 2분
let pollCount = 0;
while (!done && pollCount < MAX_POLLS) {
  pollCount++;
  await new Promise((r) => setTimeout(r, 3000));
  const statusRes = await imageApi.getStatus(jobId);
  // ...
}
if (!done) {
  throw new Error("이미지 생성 시간이 초과되었습니다.");
}
```

## 5. 검증

수정 후 동일한 k6 부하 테스트를 재실행한 결과:

| 지표                 | 수정 전               | 수정 후            |
| -------------------- | --------------------- | ------------------ |
| Job 정리             | 없음 (무한 누적)      | 10분 TTL 자동 정리 |
| 폴링 제한            | 없음 (무한 루프 가능) | 최대 40회 (2분)    |
| `@Scheduled` cleanup | 미구현                | 1분 간격 실행      |
| 힙 안정성            | 요청 비례 증가        | GC 후 안정         |

## 6. 아키텍처 선택 근거

| 대안                                      | 채택 여부 | 이유                                  |
| ----------------------------------------- | --------- | ------------------------------------- |
| `@Scheduled` TTL cleanup                  | ✅ 채택   | 구현 간단, 운영 부담 없음             |
| `WeakReference` / `SoftReference`         | ❌        | 결과 조회 전 GC로 사라질 위험         |
| Redis 외부 저장소                         | ❌        | 단일 인스턴스 환경에서 과도한 인프라  |
| `ScheduledExecutorService` per-job 타이머 | ❌        | Job마다 타이머 스레드 생성 → 오버헤드 |

## 7. 사용 도구

- **k6 v1.0.0**: HTTP 부하 테스트 (5 VU × 30s, submit → poll → result 플로우)
- **Spring Boot Actuator**: `/actuator/metrics/jvm.memory.used?tag=area:heap` 힙 모니터링
- **커스텀 모니터링 스크립트**: 1초 간격 힙 메트릭 CSV 수집 (`k6-heap-monitor.sh`)
