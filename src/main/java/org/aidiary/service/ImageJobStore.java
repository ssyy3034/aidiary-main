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

    // jobId → 결과
    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();
    // contentHash → jobId (중복 요청 캐싱용)
    private final ConcurrentHashMap<String, String> hashToJobId = new ConcurrentHashMap<>();
    // jobId → contentHash (cleanup 시 O(1) 역방향 조회용)
    private final ConcurrentHashMap<String, String> jobIdToHash = new ConcurrentHashMap<>();

    /**
     * 캐시 확인: 동일 이미지 해시의 기존 jobId를 반환합니다.
     */
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

    /**
     * 신규 작업 생성 및 캐시 매핑 등록.
     */
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
     * jobIdToHash 역방향 맵으로 O(1)에 hashToJobId 항목 제거.
     */
    @Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds(TTL_MINUTES * 60);
        int beforeSize = store.size();

        store.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().createdAt().isBefore(cutoff);
            if (expired) {
                String jobId = entry.getKey();
                // O(1) 역방향 조회로 hashToJobId 정리
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

    /** 현재 저장된 Job 수 (모니터링용) */
    public int getJobCount() {
        return store.size();
    }
}
