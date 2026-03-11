package org.aidiary.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "프로필 수정 요청 DTO")
public class UpdateProfileDTO {
    @Schema(description = "수정할 전화번호", example = "010-9876-5432")
    private String phone;
    @Schema(description = "수정할 자녀 정보")
    private ChildUpdateDTO child; // ✅ 자녀 정보는 여기서만!
}
