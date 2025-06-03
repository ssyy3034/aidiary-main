package org.aidiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChildDto {
    private Long id;
    private String parent1Features;
    private String parent2Features;
    private String prompt;
    private String gptResponse;
    private String characterImage;
}