package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.ImageJobStore;
import org.aidiary.service.ImageJobStore.JobResult;
import org.aidiary.service.ImageJobStore.Status;
import org.aidiary.service.ImageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final ImageService imageService;
    private final ImageJobStore imageJobStore;

    /**
     * 이미지 분석 요청 제출.
     * Flask 처리(30초+)를 기다리지 않고 즉시 jobId를 반환한다.
     * MultipartFile은 HTTP 요청 생명주기에 묶여있으므로 byte[]로 읽은 뒤 비동기 스레드에 전달한다.
     */
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, String>> submitAnalysis(
            @RequestParam("parent1") MultipartFile parent1,
            @RequestParam("parent2") MultipartFile parent2) throws IOException {

        byte[] parent1Bytes = parent1.getBytes();
        byte[] parent2Bytes = parent2.getBytes();

        String jobId = imageJobStore.createJob();
        imageService.processViaQueue(jobId,
                parent1Bytes, parent1.getOriginalFilename(),
                parent2Bytes, parent2.getOriginalFilename());

        return ResponseEntity.accepted().body(Map.of("jobId", jobId));
    }

    /**
     * 작업 상태 조회. 클라이언트가 폴링하여 완료 여부를 확인한다.
     * DONE 상태일 때 /result/{jobId}로 이미지를 조회할 수 있다.
     */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<Map<String, String>> getStatus(@PathVariable String jobId) {
        return imageJobStore.get(jobId)
                .map(job -> {
                    if (job.status() == Status.FAILED) {
                        return ResponseEntity.internalServerError()
                                .body(Map.of("status", "FAILED", "error", job.errorMessage()));
                    }
                    return ResponseEntity.ok(Map.of("status", job.status().name()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 완료된 이미지 결과 조회.
     */
    @GetMapping("/result/{jobId}")
    public ResponseEntity<byte[]> getResult(@PathVariable String jobId) {
        var jobOpt = imageJobStore.get(jobId);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.<byte[]>notFound().build();
        }
        JobResult job = jobOpt.get();
        return switch (job.status()) {
            case DONE -> {
                // 클라이언트 수신 즉시 메모리 해제 — TTL 10분 대기 불필요
                imageJobStore.remove(jobId);
                yield ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .body(job.imageBytes());
            }
            case FAILED -> ResponseEntity.<byte[]>internalServerError().build();
            default -> ResponseEntity.<byte[]>accepted().build(); // 아직 처리 중
        };
    }
}
