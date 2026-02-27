package org.aidiary.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aidiary.entity.Diary;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor  // JPQL constructor expression 용 (new DiaryResponseDTO(...))
public class DiaryResponseDTO {
    private Long id;
    private String title;
    private String content;
    private String emotion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DiaryResponseDTO fromEntity(Diary diary) {
        return DiaryResponseDTO.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .emotion(diary.getEmotion())
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build();
    }
}
