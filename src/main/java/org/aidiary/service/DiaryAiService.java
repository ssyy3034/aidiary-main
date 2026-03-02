package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiaryAiService {

    private static final String DAILY_QUESTION_KEY_PREFIX = "daily_question:";

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final RestTemplate restTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    /** 오늘의 질문을 Redis 캐시에서 반환. 자정에 자동 만료. */
    @SuppressWarnings("unchecked")
    public Map<String, String> getDailyQuestion() {
        String cacheKey = DAILY_QUESTION_KEY_PREFIX + LocalDate.now();

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof Map) {
            return (Map<String, String>) cached;
        }

        String url = flaskApiUrl + "/api/daily-question";
        Map<String, String> response = restTemplate.getForObject(url, Map.class);

        LocalDateTime midnight = LocalDate.now().plusDays(1).atStartOfDay();
        long ttlSeconds = Duration.between(LocalDateTime.now(), midnight).getSeconds();
        redisTemplate.opsForValue().set(cacheKey, response, Duration.ofSeconds(ttlSeconds));

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

        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return response;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getFaceLandmarks(String base64Image) {
        String url = flaskApiUrl + "/api/face-landmarks";
        log.info("Requesting face landmarks from Flask: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("image", base64Image);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForObject(url, entity, Map.class);
    }

    public ResponseEntity<byte[]> getGeneratedImage(String filename) {
        String url = flaskApiUrl + "/api/images/" + filename;
        log.info("Fetching generated image from Flask: {}", url);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, null, byte[].class);
        return response;
    }
}
