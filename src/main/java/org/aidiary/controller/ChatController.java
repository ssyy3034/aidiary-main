package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.ChatRequest;
import org.aidiary.dto.response.ChatResponse;
import org.aidiary.entity.User;
import org.aidiary.service.ChatService;
import org.aidiary.service.ChildService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Character Chat API", description = "캐릭터와의 대화 API")
public class ChatController {

    private final ChatService chatService;
    private final ChildService childService;

    @Operation(summary = "캐릭터와 대화", description = "태아 캐릭터와 대화합니다. OpenAI API를 통해 응답을 생성합니다.")
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user) {

        // 사용자의 캐릭터 성격 정보 조회
        String personality = childService.getChildByUserId(user.getId())
                .map(child -> child.getGptResponse()) // gptResponse에 성격 정보 저장됨
                .orElse(null);

        ChatResponse response = chatService.generateCharacterResponse(request, personality);
        return ResponseEntity.ok(response);
    }
}
