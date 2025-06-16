package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;

import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.aidiary.service.DiaryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @GetMapping
    public ResponseEntity<Page<DiaryResponseDTO>> getDiaries(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<DiaryResponseDTO> diaryPage = diaryService.getDiariesByUser(user.getId(), page, size);
        return ResponseEntity.ok(diaryPage);
    }


    @PostMapping
    public DiaryResponseDTO createDiary(@RequestBody CreateDiaryDTO dto,
                                        @AuthenticationPrincipal User user) {
        return diaryService.createDiary(dto, user.getId());
    }

    @PutMapping("/{id}")
    public DiaryResponseDTO updateDiary(@PathVariable Long id,
                                        @RequestBody CreateDiaryDTO dto) {
        return diaryService.updateDiary(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteDiary(@PathVariable Long id) {
        diaryService.deleteDiary(id);
    }
}
