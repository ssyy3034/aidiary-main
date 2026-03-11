package org.aidiary.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "임신 주차별 정보 응답 DTO")
public class PregnancyWeekDTO {

    // 태아 크기 (정적 데이터)
    @Schema(description = "임신 주차", example = "10")
    private int week;
    @Schema(description = "태아 크기 비교 대상", example = "자두")
    private String babySize;
    @Schema(description = "태아 길이 (cm)", example = "3.1")
    private String babySizeCm;
    @Schema(description = "태아 몸무게 (g)", example = "4")
    private String babyWeightG;

    // AI 생성 콘텐츠
    @Schema(description = "태아의 발달 상태")
    private String development;
    @Schema(description = "산모의 신체 변화")
    private String maternalChanges;
    @Schema(description = "주차별 팁")
    private String tip;

    // AI 생성 — 신규 필드
    @Schema(description = "추천 음식 목록")
    private List<String> recommendedFoods;
    @Schema(description = "안전한 운동 목록")
    private List<String> safeExercises;
    @Schema(description = "주의해야 할 증상")
    private String warningSign;
    @Schema(description = "심리적 지원 및 조언")
    private String emotionalSupport;
    @Schema(description = "권장 검진 목록")
    private String checkup;
}
