package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.DiaryAiService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/diary-ai")
@RequiredArgsConstructor
@Slf4j
public class DiaryAiController {

    private final DiaryAiService diaryAiService;

    @GetMapping("/daily-question")
    public ResponseEntity<Map<String, String>> getDailyQuestion() {
        Map<String, String> result = diaryAiService.getDailyQuestion();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/emotion-analysis")
    public ResponseEntity<Map<String, Object>> analyzeEmotion(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        Map<String, Object> result = diaryAiService.analyzeDiaryEmotion(prompt);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/drawing")
    public ResponseEntity<Map<String, Object>> generateDrawing(@RequestBody Map<String, String> request) {
        String diaryText = request.get("diary_text");
        Map<String, Object> result = diaryAiService.generateDiaryDrawing(diaryText);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        ResponseEntity<byte[]> flaskResponse = diaryAiService.getGeneratedImage(filename);

        HttpHeaders headers = new HttpHeaders();
        // Flask 응답의 Content-Type 전달, 없으면 기본값
        MediaType contentType = flaskResponse.getHeaders().getContentType();
        if (contentType != null) {
            headers.setContentType(contentType);
        } else {
            headers.setContentType(MediaType.IMAGE_PNG);
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(flaskResponse.getBody());
    }
}
