package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.DiaryAiService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, Object> result = diaryAiService.analyzeDiaryEmotion(prompt);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/drawing")
    public ResponseEntity<Map<String, Object>> generateDrawing(@RequestBody Map<String, String> request) {
        String diaryText = request.get("diary_text");
        if (diaryText == null || diaryText.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, Object> result = diaryAiService.generateDiaryDrawing(diaryText);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        // Path Traversal 방어: 경로 구분자 포함 시 거부
        if (filename == null || filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            log.warn("잘못된 파일명 요청: {}", filename);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        ResponseEntity<byte[]> flaskResponse = diaryAiService.getGeneratedImage(filename);

        HttpHeaders headers = new HttpHeaders();
        MediaType contentType = flaskResponse.getHeaders().getContentType();
        headers.setContentType(contentType != null ? contentType : MediaType.IMAGE_PNG);

        return ResponseEntity.ok()
                .headers(headers)
                .body(flaskResponse.getBody());
    }
}
