package org.aidiary.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aidiary.entity.Benefit;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "혜택 정보 DTO")
public class BenefitDTO {
    @Schema(description = "혜택 ID", example = "1")
    private Long id;
    @Schema(description = "혜택 제목", example = "첫만남 이용권")
    private String title;
    @Schema(description = "혜택 상세 설명", example = "출생 아동에게 200만원 이상의 바우처를 지급합니다.")
    private String description;
    @Schema(description = "권장 시작 주차", example = "1")
    private Integer recommendedWeekStart;
    @Schema(description = "권장 종료 주차", example = "40")
    private Integer recommendedWeekEnd;
    @Schema(description = "지원 금액/내용", example = "200만원")
    private String rewardAmount;
    @Schema(description = "사용자 완료 여부", example = "false")
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
