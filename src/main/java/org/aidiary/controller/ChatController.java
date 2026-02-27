package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.request.ChatRequest;
import org.aidiary.dto.response.ChatResponse;
import org.aidiary.dto.ChildDTO;
import org.aidiary.entity.User;
import org.aidiary.service.ChatService;
import org.aidiary.service.ChildService;
import org.aidiary.service.DiaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Character Chat API", description = "캐릭터와의 대화 API")
public class ChatController {

    private static final int PREGNANCY_DAYS = 280;
    private static final int MAX_PREGNANCY_WEEKS = 42;

    private final ChatService chatService;
    private final ChildService childService;
    private final DiaryService diaryService;

    @Operation(summary = "캐릭터와 대화", description = "태아 캐릭터와 대화합니다. OpenAI API를 통해 응답을 생성합니다.")
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user) {

        ChildDTO child = childService.getChildByUserId(user.getId()).orElse(null);

        String personality = null;
        String childName = null;
        int weeks = 0;

        if (child != null) {
            personality = child.getGptResponse();
            childName = child.getChildName();
            String birthdayStr = child.getChildBirthday();

            if (birthdayStr != null && !birthdayStr.isBlank()) {
                try {
                    LocalDate dueDate = LocalDate.parse(birthdayStr);
                    LocalDate conceptionDate = dueDate.minusDays(PREGNANCY_DAYS);
                    long daysPregnant = ChronoUnit.DAYS.between(conceptionDate, LocalDate.now());
                    weeks = (int) Math.min(Math.max(daysPregnant / 7, 0), MAX_PREGNANCY_WEEKS);
                } catch (Exception e) {
                    log.warn("출산 예정일 파싱 실패 (childBirthday={}): {}", birthdayStr, e.getMessage());
                }
            }
        }

        String recentDiary = "";
        try {
            var diaryPage = diaryService.getDiariesByUser(user.getId(), 0, 1);
            if (!diaryPage.isEmpty()) {
                recentDiary = diaryPage.getContent().get(0).getContent();
            }
        } catch (Exception e) {
            log.error("최근 일기 조회 실패: {}", e.getMessage());
        }

        ChatResponse response = chatService.generateCharacterResponse(
                request, personality, childName, weeks, user.getName(), recentDiary);
        return ResponseEntity.ok(response);
    }
}
