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

    private String childName; // ✅ 추가
    private String childBirthday; // ✅ 추가
    private String childPersonality;


    public ChildDTO(Child child) {
        this.id = child.getId();
        this.userId = child.getUser().getId();
        this.parent1Features = child.getParent1Features();
        this.parent2Features = child.getParent2Features();
        this.prompt = child.getPrompt();
        this.gptResponse = child.getGptResponse();
        this.characterImage = child.getCharacterImage();
        this.childName = child.getChildName(); // ✅ 추가
        this.childBirthday = child.getChildBirthday(); // ✅ 추가
        this.childPersonality = child.getChildPersonality();


    }
}
