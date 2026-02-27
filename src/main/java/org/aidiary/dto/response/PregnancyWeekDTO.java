package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PregnancyWeekDTO {

    private int week;
    private String babySize;
    private String babySizeCm;
    private String babyWeightG;
    private String development;
    private String maternalChanges;
    private String tip;
}
