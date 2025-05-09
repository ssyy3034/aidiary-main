// DiaryService.java
package org.aidiary.service;

import org.aidiary.dto.DiaryDTO;

import org.aidiary.entity.Diary;
import org.aidiary.repository.DiaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DiaryService {

    @Autowired
    private DiaryRepository diaryRepository;

    public Diary createDiary(DiaryDTO dto, Long userId) {
        Diary diary = Diary.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .emotion(dto.getEmotion())
                .createdAt(LocalDateTime.now())
                .userId(userId)
                .build();
        return diaryRepository.save(diary);
    }

    public Optional<Diary> getDiary(Long id) {
        return diaryRepository.findById(id);
    }

    public Diary updateDiary(Long id, DiaryDTO dto) {
        Optional<Diary> existingDiary = diaryRepository.findById(id);
        if (existingDiary.isPresent()) {
            Diary diary = existingDiary.get();
            diary.setTitle(dto.getTitle());
            diary.setContent(dto.getContent());
            diary.setEmotion(dto.getEmotion());
            return diaryRepository.save(diary);
        }
        throw new IllegalArgumentException("Diary not found");
    }

    public void deleteDiary(Long id) {
        diaryRepository.deleteById(id);
    }
}
