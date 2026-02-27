package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;
import org.aidiary.entity.FetalMovement;

import java.time.LocalDateTime;

@Data
@Builder
public class FetalMovementDTO {

    private Long id;
    private LocalDateTime movementTime;
    private int intensity;
    private String notes;
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
