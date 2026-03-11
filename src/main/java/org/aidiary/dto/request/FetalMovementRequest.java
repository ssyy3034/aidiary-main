package org.aidiary.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Schema(description = "태동 기록 요청 DTO")
public class FetalMovementRequest {

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "태동 발생 시각", example = "2025-03-02T15:30:00")
    private LocalDateTime movementTime;

    @Min(1)
    @Max(3)
    @Schema(description = "태동 강도 (1:약함, 2:보통, 3:강함)", example = "2")
    private int intensity;

    @Schema(description = "메모", example = "점심 먹고 나서 평소보다 강하게 움직임")
    private String notes;
}
