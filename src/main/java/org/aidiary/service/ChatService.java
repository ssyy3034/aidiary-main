package org.aidiary.service;

import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.request.ChatRequest;
import org.aidiary.dto.response.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ChatService {

    @Value("${api.flask.url}")
    private String flaskApiUrl; // Docker 내부 통신용 URL

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 캐릭터 채팅 - Flask FaceAPI 서버로 요청 위임
     */
    public ChatResponse generateCharacterResponse(ChatRequest request, String personality) {
        try {
            String url = flaskApiUrl + "/api/openai";
            log.info("Requesting chat response from Flask API: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            String fullPrompt = request.getMessage();

            // Context(이전 대화 등)가 있다면 프롬프트에 추가 (선택 사항 - Flask 쪽 로직에 따라 조정 가능)
            if (request.getContext() != null && !request.getContext().isEmpty()) {
                fullPrompt = "이전 대화 맥락: " + request.getContext() + "\n\n" + request.getMessage();
            }

            body.put("prompt", fullPrompt);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Flask 서버로 POST 요청 전송
            Map response = restTemplate.postForObject(url, entity, Map.class);

            if (response != null && response.containsKey("response")) {
                String aiResponse = (String) response.get("response");
                return ChatResponse.success(aiResponse);
            } else {
                log.warn("Flask API returned null or invalid response");
                return ChatResponse.error("AI 응답을 받아오지 못했습니다.");
            }

        } catch (Exception e) {
            log.error("Flask API 호출 실패: {}", e.getMessage(), e);
            return ChatResponse.error("AI 서버 통신 오류: " + e.getMessage());
        }
    }
}
