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
    private final ConcurrentHashMap<String, String> hashToJobId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> jobIdToHash = new ConcurrentHashMap<>();

    public synchronized String getCachedJobId(String contentHash) {
        String existingJobId = hashToJobId.get(contentHash);
        if (existingJobId != null) {
            if (store.containsKey(existingJobId)) {
                return existingJobId;
            }
            // TTL로 store에서 제거된 경우 캐시도 정리
            hashToJobId.remove(contentHash);
            jobIdToHash.remove(existingJobId);
        }
        return null;
    }

    public synchronized String createJobWithHash(String contentHash) {
        String jobId = UUID.randomUUID().toString();
        store.put(jobId, new JobResult(Status.PENDING, null, null, Instant.now()));
        hashToJobId.put(contentHash, jobId);
        jobIdToHash.put(jobId, contentHash);
        return jobId;
    }

    public void markProcessing(String jobId) {
        var existing = store.get(jobId);
        Instant created = (existing != null) ? existing.createdAt() : Instant.now();
        store.put(jobId, new JobResult(Status.PROCESSING, null, null, created));
    }

    public void complete(String jobId, byte[] imageBytes) {
        var existing = store.get(jobId);
        if (existing != null && existing.status() == Status.DONE) {
            log.info("[Idempotency] Job {} already DONE, skipping duplicate complete()", jobId);
            return;
        }
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

    @Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds(TTL_MINUTES * 60);
        int beforeSize = store.size();

        store.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().createdAt().isBefore(cutoff);
            if (expired) {
                String jobId = entry.getKey();
                String contentHash = jobIdToHash.remove(jobId);
                if (contentHash != null) {
                    hashToJobId.remove(contentHash);
                }
            }
            return expired;
        });

        int removed = beforeSize - store.size();
        if (removed > 0) {
            log.info("ImageJobStore cleanup: {}개 만료 Job 제거 (남은 Job: {}개)", removed, store.size());
        }
    }

    public int getJobCount() {
        return store.size();
    }
}
