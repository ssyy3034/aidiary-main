package org.aidiary.service;

import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class ChatService {

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    private final RestTemplate restTemplate;

    /**
     * 캐릭터 채팅 - Flask FaceAPI 서버로 요청 위임
     */
    public ChatResponse generateCharacterResponse(ChatRequest request, String personality, String childName,
            int weeks, String userName, String recentDiary) {
        try {
            String url = flaskApiUrl + "/api/openai";
            log.info("Requesting chat response from Flask API: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            String fullPrompt = request.getMessage();

            // Context(이전 대화 등)가 있다면 프롬프트에 추가
            if (request.getContext() != null && !request.getContext().isEmpty()) {
                fullPrompt = "이전 대화 맥락: " + request.getContext() + "\n\n" + request.getMessage();
            }

            body.put("prompt", fullPrompt);

            // Context for LangGraph
            Map<String, Object> context = new HashMap<>();
            context.put("weeks", weeks);
            context.put("user_name", userName);
            context.put("recent_diary", recentDiary != null ? recentDiary : "");
            context.put("personality", personality != null ? personality : "");
            context.put("child_name", childName != null ? childName : "");

            body.put("context", context);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Flask 서버로 POST 요청 전송
            Map response = restTemplate.postForObject(url, entity, Map.class);

            if (response != null && response.containsKey("response")) {
                String aiResponse = (String) response.get("response");
                // Intent info might be useful for logging or UI
                String intent = (String) response.get("intent");
                log.info("AI Response Intent: {}", intent);

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
