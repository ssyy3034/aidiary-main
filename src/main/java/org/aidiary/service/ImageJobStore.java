package org.aidiary.service;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ImageJobStore {

    public enum Status { PENDING, PROCESSING, DONE, FAILED }

    public record JobResult(Status status, byte[] imageBytes, String errorMessage) {}

    private final ConcurrentHashMap<String, JobResult> store = new ConcurrentHashMap<>();

    public String createJob() {
        String jobId = UUID.randomUUID().toString();
        store.put(jobId, new JobResult(Status.PENDING, null, null));
        return jobId;
    }

    public void markProcessing(String jobId) {
        store.put(jobId, new JobResult(Status.PROCESSING, null, null));
    }

    public void complete(String jobId, byte[] imageBytes) {
        store.put(jobId, new JobResult(Status.DONE, imageBytes, null));
    }

    public void fail(String jobId, String errorMessage) {
        store.put(jobId, new JobResult(Status.FAILED, null, errorMessage));
    }

    public Optional<JobResult> get(String jobId) {
        return Optional.ofNullable(store.get(jobId));
    }
}
