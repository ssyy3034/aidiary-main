package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@Schema(description = "태동 일일 요약 응답 DTO")
public class FetalMovementSummaryDTO {
    @Schema(description = "오늘 총 태동 횟수", example = "5")
    private long todayCount;
    @Schema(description = "오늘 최대 태동 강도", example = "3")
    private int todayMaxIntensity;
    @Schema(description = "오늘의 상세 태동 기록 목록")
    private List<FetalMovementDTO> todayMovements;
}
