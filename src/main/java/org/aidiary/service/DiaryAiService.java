package org.aidiary.service;

import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface DiaryAiService {

    Map<String, String> getDailyQuestion();

    Map<String, Object> analyzeDiaryEmotion(String prompt);

    Map<String, Object> generateDiaryDrawing(String diaryText);

    Map<String, Object> getFaceLandmarks(String base64Image);

    ResponseEntity<byte[]> getGeneratedImage(String filename);
}
