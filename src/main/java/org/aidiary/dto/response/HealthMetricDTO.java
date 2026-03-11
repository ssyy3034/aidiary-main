package org.aidiary.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.aidiary.entity.HealthMetric;
import java.time.LocalDate;

@Data
@Builder
@Schema(description = "건강 지표 응답 DTO")
public class HealthMetricDTO {

    @Schema(description = "기속 ID", example = "1")
    private Long id;
    @Schema(description = "기록 날짜", example = "2025-03-02")
    private LocalDate recordDate;
    @Schema(description = "체중 (kg)", example = "65.5")
    private Double weight;
    @Schema(description = "수축기 혈압 (mmHg)", example = "120")
    private Integer systolic;
    @Schema(description = "이완기 혈압 (mmHg)", example = "80")
    private Integer diastolic;

    public static HealthMetricDTO fromEntity(HealthMetric e) {
        return HealthMetricDTO.builder()
                .id(e.getId())
                .recordDate(e.getRecordDate())
                .weight(e.getWeight())
                .systolic(e.getSystolic())
                .diastolic(e.getDiastolic())
                .build();
    }
}
