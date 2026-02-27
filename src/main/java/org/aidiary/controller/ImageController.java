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
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Map;
import org.aidiary.util.ContentHashUtil;

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

        // 1. 캐싱 파악: 동일한 이미지 스펙인지 해시 생성
        String contentHash = ContentHashUtil.calculateHash(parent1Bytes, parent2Bytes);

        // 2. 캐시 히트 시 즉시 응답 반환 (큐에 중복 적재 방지)
        String existingJobId = imageJobStore.getCachedJobId(contentHash);
        if (existingJobId != null) {
            log.info("🎯 Cache Hit! 동일 이미지 해시 요청, 기존 작업 ID 반환: {}", existingJobId);
            return ResponseEntity.accepted().body(Map.of("jobId", existingJobId));
        }

        // 3. 신규 요청: Job 생성 후 큐 적재
        String jobId = imageJobStore.createJobWithHash(contentHash);
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
                // 캐싱을 위해 클라이언트 수신 즉시 삭제하지 않음.
                // 메모리 관리는 ImageJobStore의 TTL cleanup에 위임.
                yield ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .body(job.imageBytes());
            }
            case FAILED -> ResponseEntity.<byte[]>internalServerError().build();
            default -> ResponseEntity.<byte[]>accepted().build(); // 아직 처리 중
        };
    }

    /**
     * Python Face API 워커가 작업 처리 후 결과를 송신하는 Webhook.
     * 외부 퍼블릭 접근을 막기 위해 시큐리티 설정이나 내부망 전용 IP 필터링 권장.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> receiveWebhook(
            @RequestParam("jobId") String jobId,
            @RequestParam("status") String status,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "error", required = false) String error) {

        log.info("📥 Webhook 수신: jobId={}, status={}", jobId, status);

        if ("SUCCESS".equalsIgnoreCase(status) && image != null) {
            try {
                imageJobStore.complete(jobId, image.getBytes());
            } catch (IOException e) {
                log.error("Webhook 이미지 읽기 실패: {}", jobId, e);
                imageJobStore.fail(jobId, "Webhook 처리 중 에러 발생");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } else {
            imageJobStore.fail(jobId, error != null ? error : "Unknown ML Error");
        }

        return ResponseEntity.ok().build();
    }
}
