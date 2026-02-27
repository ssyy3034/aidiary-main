package org.aidiary.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aidiary.entity.Benefit;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenefitDTO {
    private Long id;
    private String title;
    private String description;
    private Integer recommendedWeekStart;
    private Integer recommendedWeekEnd;
    private String rewardAmount;
    private boolean completed; // Computed field indicating if the user has checked it off

    public static BenefitDTO fromEntity(Benefit benefit, boolean completed) {
        return BenefitDTO.builder()
                .id(benefit.getId())
                .title(benefit.getTitle())
                .description(benefit.getDescription())
                .recommendedWeekStart(benefit.getRecommendedWeekStart())
                .recommendedWeekEnd(benefit.getRecommendedWeekEnd())
                .rewardAmount(benefit.getRewardAmount())
                .completed(completed)
                .build();
    }
}
