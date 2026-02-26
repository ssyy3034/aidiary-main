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

    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();

    public String createJob() {
        String jobId = UUID.randomUUID().toString();
        store.put(jobId, new JobResult(Status.PENDING, null, null, Instant.now()));
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

    /**
     * 메모리 누수 방지: TTL_MINUTES를 초과한 Job을 정리한다.
     * ConcurrentHashMap에 strong reference로 유지되는 byte[]는
     * GC 대상이 되지 않으므로, 명시적으로 제거해야 한다.
     */
    @Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds(TTL_MINUTES * 60);
        int beforeSize = store.size();

        store.entrySet().removeIf(entry -> entry.getValue().createdAt().isBefore(cutoff));

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
