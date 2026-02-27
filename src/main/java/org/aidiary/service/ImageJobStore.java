package org.aidiary.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ImageJobStore {

    public enum Status {
        PENDING, PROCESSING, DONE, FAILED
    }

    public record JobResult(Status status, byte[] imageBytes, String errorMessage, Instant createdAt) {
    }

    private static final long TTL_MINUTES = 10;

    // jobId -> 결과 저장소
    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();
    // contentHash -> jobId 매핑 캐시
    private final ConcurrentHashMap<String, String> hashToJobId = new ConcurrentHashMap<>();

    /**
     * 캐시 확인: 기존에 진행 중이거나 완료된 해시면 저장된 jobId를 반환합니다.
     */
    public synchronized String getCachedJobId(String contentHash) {
        if (hashToJobId.containsKey(contentHash)) {
            String existingJobId = hashToJobId.get(contentHash);
            // 원본 데이터가 TTL로 인해 지워지진 않았는지 확인
            if (store.containsKey(existingJobId)) {
                return existingJobId;
            } else {
                hashToJobId.remove(contentHash); // 만료된 캐시 키 정리
            }
        }
        return null;
    }

    /**
     * 신규 작업 생성 및 캐시 매핑 등록.
     */
    public synchronized String createJobWithHash(String contentHash) {
        String jobId = UUID.randomUUID().toString();
        store.put(jobId, new JobResult(Status.PENDING, null, null, Instant.now()));
        hashToJobId.put(contentHash, jobId);
        return jobId;
    }

    public void markProcessing(String jobId) {
        var existing = store.get(jobId);
        Instant created = (existing != null) ? existing.createdAt() : Instant.now();
        store.put(jobId, new JobResult(Status.PROCESSING, null, null, created));
    }

    public void complete(String jobId, byte[] imageBytes) {
        var existing = store.get(jobId);
        Instant created = (existing != null) ? existing.createdAt() : Instant.now();
        store.put(jobId, new JobResult(Status.DONE, imageBytes, null, created));
    }

    public void fail(String jobId, String errorMessage) {
        var existing = store.get(jobId);
        Instant created = (existing != null) ? existing.createdAt() : Instant.now();
        store.put(jobId, new JobResult(Status.FAILED, null, errorMessage, created));
    }

    public Optional<JobResult> get(String jobId) {
        return Optional.ofNullable(store.get(jobId));
    }

    // 클라이언트가 결과를 수신해도 해시 캐싱 유지를 위해 즉시 제거하지 않음.
    // TTL_MINUTES 기반 cleanup()에 메모리 관리를 온전히 위임.

    /**
     * 메모리 누수 방지: TTL_MINUTES를 초과한 Job을 정리한다.
     * ConcurrentHashMap에 strong reference로 유지되는 byte[]는
     * GC 대상이 되지 않으므로, 명시적으로 제거해야 한다.
     */
    @Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds(TTL_MINUTES * 60);
        int beforeSize = store.size();

        // 오래된 잡 찾아서 제거
        store.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().createdAt().isBefore(cutoff);
            if (expired) {
                // hashToJobId 맵에서도 해당 jobId를 가진 엔트리 제거
                hashToJobId.values().remove(entry.getKey());
            }
            return expired;
        });

        int removed = beforeSize - store.size();
        if (removed > 0) {
            log.info("ImageJobStore cleanup: {}개 만료 Job 제거 (남은 Job: {}개)", removed, store.size());
        }
    }

    /** 현재 저장된 Job 수 (모니터링용) */
    public int getJobCount() {
        return store.size();
    }
}
