package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FetalMovementSummaryDTO {

    private long todayCount;
    private int todayMaxIntensity;
    private List<FetalMovementDTO> todayMovements;
}
