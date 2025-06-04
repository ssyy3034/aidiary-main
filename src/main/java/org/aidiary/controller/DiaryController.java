package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.DiaryResponseDTO;
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
    public List<DiaryResponseDTO> getAllDiaries(@AuthenticationPrincipal User user) {
        return diaryService.getAllDiaries();
    }

    @PostMapping
    public Diary createDiary(@RequestBody CreateDiaryDTO dto,
                             @AuthenticationPrincipal User user) {
        return diaryService.createDiary(dto, user.getId()); // userId를 서버에서 추출
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<DiaryResponseDTO> getDiary(@PathVariable Long id) {
//        return diaryService.getDiary(id)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.notFound().build());
//    }

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
