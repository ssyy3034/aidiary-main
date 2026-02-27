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

    /**
     * 오늘의 일기 질문을 반환한다.
     *
     * <p>외부 AI API(OpenAI/Gemini)는 요청당 ~300–800 ms 지연과 API 비용이 발생한다.
     * "오늘의 질문"은 하루 동안 모든 사용자에게 동일해야 하므로
     * 날짜를 키로 Redis에 캐싱하고 자정에 자동 만료되도록 설정한다.
     *
     * <ul>
     *   <li>Cache key : {@code daily_question:YYYY-MM-DD}</li>
     *   <li>TTL       : 현재 시각 → 다음 날 자정 (오늘이 끝나면 자동 무효화)</li>
     *   <li>HIT       : Redis 반환 (~1 ms)</li>
     *   <li>MISS      : Flask → AI API 호출 후 Redis 저장</li>
     * </ul>
     */
    @SuppressWarnings("unchecked")
    public Map<String, String> getDailyQuestion() {
        String cacheKey = DAILY_QUESTION_KEY_PREFIX + LocalDate.now();

        // 1. 캐시 조회 — HIT 시 AI API 호출 없이 즉시 반환
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof Map) {
            log.debug("[Cache HIT] daily_question:{}", LocalDate.now());
            return (Map<String, String>) cached;
        }

        // 2. Cache MISS → Flask(AI API) 호출
        log.info("[Cache MISS] daily_question:{} — calling Flask AI API", LocalDate.now());
        String url = flaskApiUrl + "/api/daily-question";
        Map<String, String> response = restTemplate.getForObject(url, Map.class);

        // 3. 자정까지 남은 시간을 TTL로 설정 → 날짜가 바뀌면 자동으로 새 질문 생성
        LocalDateTime midnight = LocalDate.now().plusDays(1).atStartOfDay();
        long ttlSeconds = Duration.between(LocalDateTime.now(), midnight).getSeconds();
        redisTemplate.opsForValue().set(cacheKey, response, Duration.ofSeconds(ttlSeconds));
        log.info("[Cache SET] daily_question:{}, ttl={}s (until midnight)", LocalDate.now(), ttlSeconds);

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
