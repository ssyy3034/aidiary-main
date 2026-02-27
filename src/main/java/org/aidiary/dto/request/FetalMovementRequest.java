package org.aidiary.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FetalMovementRequest {

    @NotNull
    private LocalDateTime movementTime;

    @Min(1) @Max(3)
    private int intensity;

    private String notes;
}
