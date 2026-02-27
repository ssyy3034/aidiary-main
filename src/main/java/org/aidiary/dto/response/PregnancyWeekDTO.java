package org.aidiary.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class PregnancyWeekDTO {

    // 태아 크기 (정적 데이터)
    private int week;
    private String babySize;
    private String babySizeCm;
    private String babyWeightG;

    // AI 생성 콘텐츠
    private String development;
    private String maternalChanges;
    private String tip;

    // AI 생성 — 신규 필드
    private List<String> recommendedFoods;
    private List<String> safeExercises;
    private String warningSign;
    private String emotionalSupport;
    private String checkup;
}
