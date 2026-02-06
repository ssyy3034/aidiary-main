package org.aidiary.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

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
    public DiaryResponseDTO updateDiary(Long id, CreateDiaryDTO dto, Long userId) {
        Diary diary = diaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diary", id));

        // 소유자 검증: 본인의 일기만 수정 가능
        if (!diary.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 일기만 수정할 수 있습니다.");
        }

        diary.setTitle(dto.getTitle());
        diary.setContent(dto.getContent());
        diary.setEmotion(dto.getEmotion());

        return DiaryResponseDTO.fromEntity(diary); // JPA flush로 자동 반영됨
    }

    @Transactional
    public void deleteDiary(Long id, Long userId) {
        Diary diary = diaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diary", id));

        // 소유자 검증: 본인의 일기만 삭제 가능
        if (!diary.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 일기만 삭제할 수 있습니다.");
        }

        diaryRepository.deleteById(id);
    }

    public Page<DiaryResponseDTO> getDiariesByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return diaryRepository.findAllByUserId(userId, pageable)
                .map(DiaryResponseDTO::fromEntity);
    }
}
