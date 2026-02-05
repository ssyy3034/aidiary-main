package org.aidiary.mapper;

import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Diary Entity-DTO 매퍼
 * Entity와 DTO 간 변환 로직을 분리하여 관심사 분리
 */
@Component
public class DiaryMapper {

    /**
     * Entity → ResponseDTO 변환
     */
    public DiaryResponseDTO toDto(Diary entity) {
        if (entity == null) {
            return null;
        }
        return DiaryResponseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .emotion(entity.getEmotion())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    /**
     * CreateDTO + User → Entity 변환
     */
    public Diary toEntity(CreateDiaryDTO dto, User user) {
        if (dto == null) {
            return null;
        }
        return Diary.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .emotion(dto.getEmotion())
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();
    }

    /**
     * 기존 Entity에 DTO 값 적용 (업데이트용)
     */
    public void updateEntity(Diary entity, CreateDiaryDTO dto) {
        if (entity == null || dto == null) {
            return;
        }
        entity.setTitle(dto.getTitle());
        entity.setContent(dto.getContent());
        entity.setEmotion(dto.getEmotion());
    }
}
