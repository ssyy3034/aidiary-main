package org.aidiary.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.PersonalityService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FlaskPersonalityService implements PersonalityService {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final RestTemplate restTemplate;

    @Override
    public Map<String, Object> chat(Map<String, Object> payload) {
        String url = flaskApiUrl + "/api/personality-chat";
        log.info("Requesting personality chat from Flask API: {}", url);
        return callFlask(url, payload);
    }

    @Override
    public Map<String, Object> synthesize(Map<String, Object> payload) {
        String url = flaskApiUrl + "/api/personality-synthesize";
        log.info("Requesting personality synthesize from Flask API: {}", url);
        return callFlask(url, payload);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callFlask(String url, Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        return restTemplate.postForObject(url, entity, Map.class);
    }
}
