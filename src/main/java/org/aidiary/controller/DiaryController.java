// DiaryController.java
package org.aidiary.controller;

import org.aidiary.dto.DiaryDTO;
import org.aidiary.entity.Diary;
import org.aidiary.service.DiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/diary")
public class DiaryController {

    @Autowired
    private DiaryService diaryService;

    @PostMapping
    public Diary createDiary(@RequestBody DiaryDTO dto, @RequestParam Long userId) {
        return diaryService.createDiary(dto, userId);
    }

    @GetMapping("/{id}")
    public Optional<Diary> getDiary(@PathVariable Long id) {
        return diaryService.getDiary(id);
    }

    @PutMapping("/{id}")
    public Diary updateDiary(@PathVariable Long id, @RequestBody DiaryDTO dto) {
        return diaryService.updateDiary(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteDiary(@PathVariable Long id) {
        diaryService.deleteDiary(id);
    }
}