package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;
import org.aidiary.entity.Diary;

import java.time.LocalDateTime;

@Data
@Builder
public class DiaryResponseDTO {
    private Long id;
    private String title;
    private String content;
    private String emotion;
    private LocalDateTime createdAt;

    public static DiaryResponseDTO fromEntity(Diary diary) {
        return DiaryResponseDTO.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .emotion(diary.getEmotion())
                .createdAt(diary.getCreatedAt())
                .build();
    }
}
