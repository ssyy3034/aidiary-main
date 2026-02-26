package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final ImageJobStore imageJobStore;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 비동기 이미지 분석 요청.
     * MultipartFile은 HTTP 요청 생명주기에 묶여있으므로,
     * 컨트롤러에서 byte[]로 미리 읽어서 전달받는다.
     */
    @Async("imageTaskExecutor")
    public void processAsync(String jobId, byte[] parent1Bytes, String parent1Name,
                             byte[] parent2Bytes, String parent2Name) {
        imageJobStore.markProcessing(jobId);
        try {
            byte[] result = callFlask(parent1Bytes, parent1Name, parent2Bytes, parent2Name);
            imageJobStore.complete(jobId, result);
            log.info("Image job {} completed", jobId);
        } catch (Exception e) {
            imageJobStore.fail(jobId, e.getMessage());
            log.error("Image job {} failed: {}", jobId, e.getMessage());
        }
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

    /** @deprecated 동기 호출 방식 — processAsync() 사용 권장 */
    @Deprecated
    public byte[] sendImages(MultipartFile parent1, MultipartFile parent2) throws IOException {
        return callFlask(parent1.getBytes(), parent1.getOriginalFilename(),
                         parent2.getBytes(), parent2.getOriginalFilename());
    }

    /**
     * MultipartFile을 전송하기 위한 Helper Class
     */
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
