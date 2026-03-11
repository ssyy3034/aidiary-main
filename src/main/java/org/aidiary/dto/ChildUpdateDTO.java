package org.aidiary.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "자녀 정보 수정 DTO")
public class ChildUpdateDTO {
    @Schema(description = "아이 이름", example = "튼튼이")
    private String childName;
    @Schema(description = "아이 생일/예정일", example = "2025-10-10")
    private String childBirthday;
    @Schema(description = "추가 분석/응답 결과 (GPT)")
    private String gptResponse;
}
