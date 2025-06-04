package org.aidiary.dto;

import lombok.Data;

@Data


public class ChildUpdateDTO {
    private String parent1Features;
    private String parent2Features;
    private String prompt;
    private String gptResponse;
    private String characterImage;
}
