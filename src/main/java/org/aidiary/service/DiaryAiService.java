package org.aidiary.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class DiaryAiService {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public Map<String, String> getDailyQuestion() {
        String url = flaskApiUrl + "/api/daily-question";
        log.info("Fetching daily question from Flask: {}", url);

        Map<String, String> response = restTemplate.getForObject(url, Map.class);
        return response;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeDiaryEmotion(String prompt) {
        String url = flaskApiUrl + "/api/openai";
        log.info("Requesting emotion analysis from Flask: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("prompt", prompt);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return response;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateDiaryDrawing(String diaryText) {
        String url = flaskApiUrl + "/api/diary-drawing";
        log.info("Requesting diary drawing from Flask: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("diary_text", diaryText);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // 이미지 생성은 시간이 오래 걸리므로 별도 타임아웃 설정 없이 기본값 사용
        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return response;
    }

    public ResponseEntity<byte[]> getGeneratedImage(String filename) {
        String url = flaskApiUrl + "/api/images/" + filename;
        log.info("Fetching generated image from Flask: {}", url);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, null, byte[].class);
        return response;
    }
}
