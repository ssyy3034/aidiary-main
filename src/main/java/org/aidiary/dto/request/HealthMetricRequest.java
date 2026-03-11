package org.aidiary.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;

@Data
@Schema(description = "건강 지표 기록 요청 DTO")
public class HealthMetricRequest {

    @Schema(description = "기록 날짜", example = "2025-03-02")
    private LocalDate recordDate;
    @Schema(description = "체중 (kg)", example = "65.5")
    private Double weight;
    @Schema(description = "수축기 혈압 (mmHg)", example = "120")
    private Integer systolic;
    @Schema(description = "이완기 혈압 (mmHg)", example = "80")
    private Integer diastolic;
}
