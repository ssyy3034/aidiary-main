package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.request.ChatRequest;
import org.aidiary.dto.response.ChatResponse;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.aidiary.service.ChatService;
import org.aidiary.service.ChildService;
import org.aidiary.service.DiaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Character Chat API", description = "캐릭터와의 대화 API")
public class ChatController {

    private final ChatService chatService;
    private final ChildService childService;
    private final DiaryService diaryService;

    @Operation(summary = "캐릭터와 대화", description = "태아 캐릭터와 대화합니다. OpenAI API를 통해 응답을 생성합니다.")
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user) {

        // 사용자의 캐릭터 성격 정보 및 생일 조회
        // Child entity stores birthday as String. Assuming format YYYY-MM-DD
        // We need to calculate gestational age (weeks).
        // Pregnancy usually lasts 40 weeks.
        // If childBirthday is expected due date:
        // Current Date - (Due Date - 280 days) = Days Pregnant
        // Weeks = Days / 7

        Child child = childService.getChildByUserId(user.getId()).orElse(null);

        String personality = null;
        int weeks = 0;
        String userName = user.getName();

        if (child != null) {
            personality = child.getGptResponse();
            String birthdayStr = child.getChildBirthday();

            if (birthdayStr != null && !birthdayStr.isEmpty()) {
                try {
                    // Assuming birthdayStr is "YYYY-MM-DD"
                    java.time.LocalDate dueDate = java.time.LocalDate.parse(birthdayStr);
                    java.time.LocalDate conceptionDate = dueDate.minusDays(280);
                    java.time.LocalDate today = java.time.LocalDate.now();

                    long daysPregnant = java.time.temporal.ChronoUnit.DAYS.between(conceptionDate, today);
                    weeks = (int) (daysPregnant / 7);

                    if (weeks < 0)
                        weeks = 0;
                    if (weeks > 42)
                        weeks = 42; // Cap at max

                } catch (Exception e) {
                    // Log error or ignore, default to 0
                    System.err.println("Failed to parse child birthday: " + e.getMessage());
                }
            }
        }

        // Fetch most recent diary entry
        String recentDiary = "";
        try {
            var diaryPage = diaryService.getDiariesByUser(user.getId(), 0, 1);
            if (!diaryPage.isEmpty()) {
                recentDiary = diaryPage.getContent().get(0).getContent();
            }
        } catch (Exception e) {
            log.error("Failed to fetch recent diary: {}", e.getMessage());
        }

        ChatResponse response = chatService.generateCharacterResponse(request, personality, weeks, userName,
                recentDiary);
        return ResponseEntity.ok(response);
    }
}
