package org.aidiary.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class HealthMetricRequest {

    private LocalDate recordDate;
    private Double weight;
    private Integer systolic;
    private Integer diastolic;
}
