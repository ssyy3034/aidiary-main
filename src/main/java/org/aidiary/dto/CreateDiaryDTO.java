// CreateDiaryDTO.java
package org.aidiary.dto;

import lombok.Getter;
import lombok.Setter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Setter
@Schema(description = "일기 생성/수정 요청 DTO")
public class CreateDiaryDTO {
    @Schema(description = "일기 제목", example = "오늘의 일기")
    private String title;
    @Schema(description = "일기 내용", example = "오늘은 날씨가 좋았다.")
    private String content;
    @Schema(description = "일기 감정", example = "HAPPY")
    private String emotion;
}
