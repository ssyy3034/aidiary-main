package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;
import org.aidiary.entity.FetalMovement;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@Schema(description = "태동 기록 응답 DTO")
public class FetalMovementDTO {
    @Schema(description = "기록 ID", example = "1")
    private Long id;
    @Schema(description = "태동 발생 시각")
    private LocalDateTime movementTime;
    @Schema(description = "태동 강도 (1-5)", example = "3")
    private int intensity;
    @Schema(description = "입력 메모", example = "활발하게 움직임")
    private String notes;
    @Schema(description = "기록 생성 시각")
    private LocalDateTime createdAt;

    public static FetalMovementDTO fromEntity(FetalMovement e) {
        return FetalMovementDTO.builder()
                .id(e.getId())
                .movementTime(e.getMovementTime())
                .intensity(e.getIntensity())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
