package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.config.RabbitMQConfig;
import org.aidiary.dto.ImageJobMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * RabbitMQ 메시지 소비자.
 * 큐에서 이미지 분석 요청을 받아 Flask API를 호출한다.
 *
 * @Async + ThreadPool과 달리:
 *        - Tomcat 스레드를 점유하지 않음 → API 응답성 보장
 *        - 컨테이너 재시작해도 큐에 메시지가 남아 자동 재처리
 *        - DLQ로 실패 메시지 별도 보관 → 디버깅 용이
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImageConsumer {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final ImageJobStore imageJobStore;
    private final RestTemplate restTemplate = new RestTemplate();

    @RabbitListener(queues = RabbitMQConfig.IMAGE_QUEUE, concurrency = "5-10")
    public void consumeImageJob(ImageJobMessage message) {
        String jobId = message.getJobId();
        log.info("🐰 RabbitMQ 메시지 수신: jobId={}", jobId);

        imageJobStore.markProcessing(jobId);
        try {
            byte[] result = callFlask(
                    message.getParent1Bytes(), message.getParent1Name(),
                    message.getParent2Bytes(), message.getParent2Name());
            imageJobStore.complete(jobId, result);
            log.info("✅ Image job {} completed via RabbitMQ", jobId);
        } catch (Exception e) {
            log.error("❌ Image job {} failed: {}", jobId, e.getMessage());
            imageJobStore.fail(jobId, e.getMessage());
        }
    }

    private byte[] callFlask(byte[] parent1Bytes, String parent1Name,
            byte[] parent2Bytes, String parent2Name) {
        String url = flaskApiUrl + "/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("parent1", new NamedByteArrayResource(parent1Name, parent1Bytes));
        body.add("parent2", new NamedByteArrayResource(parent2Name, parent2Bytes));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.postForEntity(url, requestEntity, byte[].class);

        if (response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        } else {
            throw new RuntimeException("Flask API error: " + response.getStatusCode());
        }
    }

    static class NamedByteArrayResource extends ByteArrayResource {
        private final String fileName;

        public NamedByteArrayResource(String fileName, byte[] byteArray) {
            super(byteArray);
            this.fileName = fileName;
        }

        @Override
        public String getFilename() {
            return fileName;
        }
    }
}
