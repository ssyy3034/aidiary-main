package org.aidiary.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aidiary.entity.Diary;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor // JPQL constructor expression 용 (new DiaryResponseDTO(...))
@Schema(description = "일기 응답 DTO")
public class DiaryResponseDTO {
    @Schema(description = "일기 ID", example = "1")
    private Long id;
    @Schema(description = "일기 제목", example = "오늘의 일기")
    private String title;
    @Schema(description = "일기 내용", example = "오늘은 날씨가 좋았다.")
    private String content;
    @Schema(description = "일기 감정", example = "HAPPY")
    private String emotion;
    @Schema(description = "작성 일시")
    private LocalDateTime createdAt;
    @Schema(description = "수정 일시")
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
