package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.aidiary.service.DiaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @GetMapping
    public List<Diary> getAllDiaries(@AuthenticationPrincipal User user) {
        // TODO: 유저별 일기만 조회하려면 diaryService.getUserDiaries(user.getId()) 도입
        return diaryService.getAllDiaries();
    }

    @PostMapping
    public Diary createDiary(@RequestBody CreateDiaryDTO dto,
                             @AuthenticationPrincipal User user) {
        return diaryService.createDiary(dto, user.getId()); // userId를 서버에서 추출
    }

    @GetMapping("/{id}")
    public ResponseEntity<Diary> getDiary(@PathVariable Long id) {
        return diaryService.getDiary(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Diary updateDiary(@PathVariable Long id,
                             @RequestBody CreateDiaryDTO dto) {
        return diaryService.updateDiary(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteDiary(@PathVariable Long id) {
        diaryService.deleteDiary(id);
    }
}
