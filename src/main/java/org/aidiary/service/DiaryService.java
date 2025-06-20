package org.aidiary.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.aidiary.repository.DiaryRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;

    @Transactional
    public DiaryResponseDTO createDiary(CreateDiaryDTO dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Diary diary = Diary.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .emotion(dto.getEmotion())
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        Diary saved = diaryRepository.save(diary);
        return DiaryResponseDTO.fromEntity(saved);
    }

    @Transactional
    public DiaryResponseDTO updateDiary(Long id, CreateDiaryDTO dto) {
        Diary diary = diaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("일기를 찾을 수 없습니다."));

        diary.setTitle(dto.getTitle());
        diary.setContent(dto.getContent());
        diary.setEmotion(dto.getEmotion());

        return DiaryResponseDTO.fromEntity(diary); // JPA flush로 자동 반영됨
    }


    public List<DiaryResponseDTO> getAllDiaries() {
        return diaryRepository.findAll().stream()
                .map(DiaryResponseDTO::fromEntity)
                .distinct() // 중복 제거
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDiary(Long id) {
        if (!diaryRepository.existsById(id)) {
            throw new IllegalArgumentException("삭제할 일기가 존재하지 않습니다.");
        }
        diaryRepository.deleteById(id);
    }

    public Page<DiaryResponseDTO> getDiariesByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return diaryRepository.findAllByUserId(userId, pageable)
                .map(DiaryResponseDTO::fromEntity);
    }
}
