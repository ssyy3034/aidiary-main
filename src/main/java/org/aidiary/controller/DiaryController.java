package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.User;
import org.aidiary.service.DiaryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
@Tag(name = "Diary API", description = "일기 CRUD API")
public class DiaryController {

    private final DiaryService diaryService;

    @Operation(summary = "일기 목록 조회", description = "로그인한 사용자의 일기 목록을 페이지네이션하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping
    public ResponseEntity<Page<DiaryResponseDTO>> getDiaries(
            @AuthenticationPrincipal User user,
            @Parameter(description = "페이지 번호 (0부터 시작)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int size) {

        Page<DiaryResponseDTO> diaryPage = diaryService.getDiariesByUser(user.getId(), page, size);
        return ResponseEntity.ok(diaryPage);
    }

    @Operation(summary = "일기 작성", description = "새로운 일기를 작성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "작성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @PostMapping
    public DiaryResponseDTO createDiary(@RequestBody CreateDiaryDTO dto,
            @AuthenticationPrincipal User user) {
        return diaryService.createDiary(dto, user.getId());
    }

    @Operation(summary = "일기 수정", description = "기존 일기를 수정합니다. 본인의 일기만 수정 가능합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    @PutMapping("/{id}")
    public DiaryResponseDTO updateDiary(
            @Parameter(description = "일기 ID") @PathVariable Long id,
            @RequestBody CreateDiaryDTO dto,
            @AuthenticationPrincipal User user) {
        return diaryService.updateDiary(id, dto, user.getId());
    }

    @Operation(summary = "일기 감정 업데이트", description = "AI 분석 결과로 일기의 감정을 업데이트합니다.")
    @PatchMapping("/{id}/emotion")
    public DiaryResponseDTO updateEmotion(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String emotion = body.get("emotion");
        return diaryService.updateEmotion(id, emotion, user.getId());
    }

    @Operation(summary = "일기 삭제", description = "기존 일기를 삭제합니다. 본인의 일기만 삭제 가능합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "일기를 찾을 수 없음")
    })
    @DeleteMapping("/{id}")
    public void deleteDiary(
            @Parameter(description = "일기 ID") @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        diaryService.deleteDiary(id, user.getId());
    }
}
