package org.aidiary.dto;

import lombok.*;
import org.aidiary.entity.Child;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChildDTO {
    private Long id; // 자녀 ID
    private Long userId; // 부모 User ID
    private String parent1Features;
    private String parent2Features;
    private String prompt;
    private String gptResponse;
    private String characterImage;


    public ChildDTO(Child child) {
    }
}
