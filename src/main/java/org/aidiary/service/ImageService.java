package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.config.RabbitMQConfig;
import org.aidiary.dto.ImageJobMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final ImageJobStore imageJobStore;
    private final RabbitTemplate rabbitTemplate;
    private final org.springframework.amqp.rabbit.core.RabbitAdmin rabbitAdmin;
    private final RestTemplate restTemplate;

    public void processViaQueue(String jobId, byte[] parent1Bytes, String parent1Name,
            byte[] parent2Bytes, String parent2Name) {

        // 큐 포화 시 429 반환
        java.util.Properties queueProperties = rabbitAdmin.getQueueProperties(RabbitMQConfig.IMAGE_QUEUE);
        if (queueProperties != null) {
            Object msgCountObj = queueProperties.get(org.springframework.amqp.rabbit.core.RabbitAdmin.QUEUE_MESSAGE_COUNT);
            if (msgCountObj instanceof Integer && (Integer) msgCountObj >= 100) {
                log.warn("큐 포화 ({}건), 요청 거절", msgCountObj);
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "현재 이용자가 많아 사진 합성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
            }
        }

        ImageJobMessage message = new ImageJobMessage(
                jobId, parent1Bytes, parent1Name, parent2Bytes, parent2Name);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE,
                RabbitMQConfig.IMAGE_ROUTING_KEY,
                message);
        log.info("Image job {} queued", jobId);
    }

    private byte[] callFlask(byte[] parent1Bytes, String parent1Name,
            byte[] parent2Bytes, String parent2Name) throws IOException {
        String url = flaskApiUrl + "/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("parent1", new FileSystemResource(parent1Name, parent1Bytes));
        body.add("parent2", new FileSystemResource(parent2Name, parent2Bytes));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.postForEntity(url, requestEntity, byte[].class);

        if (response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        } else {
            throw new IOException("Flask API error: " + response.getStatusCode());
        }
    }

    static class FileSystemResource extends ByteArrayResource {
        private final String fileName;

        public FileSystemResource(String fileName, byte[] byteArray) {
            super(byteArray);
            this.fileName = fileName;
        }

        @Override
        public String getFilename() {
            return fileName;
        }
    }

}
