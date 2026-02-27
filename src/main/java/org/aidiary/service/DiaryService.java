package org.aidiary.service;

import org.springframework.transaction.annotation.Transactional;
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
                .user(user)
                .build();

        Diary saved = diaryRepository.save(diary);
        return DiaryResponseDTO.fromEntity(saved);
    }

    @Transactional
    public DiaryResponseDTO updateDiary(Long id, CreateDiaryDTO dto, Long userId) {
        // findWithUserById: @EntityGraph로 user를 함께 로딩 → 소유권 확인 쿼리 1회
        Diary diary = diaryRepository.findWithUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diary", id));

        if (!diary.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 일기만 수정할 수 있습니다.");
        }

        diary.setTitle(dto.getTitle());
        diary.setContent(dto.getContent());
        diary.setEmotion(dto.getEmotion());

        return DiaryResponseDTO.fromEntity(diary); // JPA flush로 자동 반영됨
    }

    @Transactional
    public DiaryResponseDTO updateEmotion(Long id, String emotion, Long userId) {
        Diary diary = diaryRepository.findWithUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diary", id));

        if (!diary.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 일기만 수정할 수 있습니다.");
        }

        diary.setEmotion(emotion);
        return DiaryResponseDTO.fromEntity(diary);
    }

    @Transactional
    public void deleteDiary(Long id, Long userId) {
        Diary diary = diaryRepository.findWithUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diary", id));

        if (!diary.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 일기만 삭제할 수 있습니다.");
        }

        diaryRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<DiaryResponseDTO> getDiariesByUser(Long userId, int page, int size) {
        // Pageable의 sort는 JPQL에서 ORDER BY로 처리하므로 여기서는 page/size만 사용
        Pageable pageable = PageRequest.of(page, size);

        // DTO Projection: Entity 미생성, 필요한 컬럼만 SELECT, JOIN 없음
        return diaryRepository.findDiaryDTOsByUserId(userId, pageable);
    }
}
