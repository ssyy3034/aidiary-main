package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;
import org.aidiary.entity.HealthMetric;

import java.time.LocalDate;

@Data
@Builder
public class HealthMetricDTO {

    private Long id;
    private LocalDate recordDate;
    private Double weight;
    private Integer systolic;
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
