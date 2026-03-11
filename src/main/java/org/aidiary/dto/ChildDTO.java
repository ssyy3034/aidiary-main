package org.aidiary.dto;

import lombok.*;
import org.aidiary.entity.Child;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "아이 정보 DTO")
public class ChildDTO {
    @Schema(description = "자녀 ID", example = "1")
    private Long id; // 자녀 ID
    @Schema(description = "부모 User ID", example = "10")
    private Long userId; // 부모 User ID
    @Schema(description = "부모 1 특징", example = "쌍꺼풀, 높은 코")
    private String parent1Features;
    @Schema(description = "부모 2 특징", example = "보조개, 갈색 눈")
    private String parent2Features;
    @Schema(description = "캐릭터 생성을 위한 프롬프트")
    private String prompt;
    @Schema(description = "GPT 응답/분석 내용")
    private String gptResponse;
    @Schema(description = "생성된 캐릭터 이미지 URL")
    private String characterImage;

    @Schema(description = "아이 이름", example = "동동이")
    private String childName; // ✅ 추가
    @Schema(description = "아이 생일/예정일", example = "2025-12-25")
    private String childBirthday; // ✅ 추가
    @Schema(description = "아이 성격", example = "활발하고 호기심 많은")
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
