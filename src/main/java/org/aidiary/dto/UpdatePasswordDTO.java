package org.aidiary.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "비밀번호 변경 요청 DTO")
public class UpdatePasswordDTO {
    @Schema(description = "현재 비밀번호", example = "oldpassword123!")
    @NotBlank(message = "기존 비밀번호는 필수입니다.")
    private String currentPassword;

    @Schema(description = "새 비밀번호", example = "newpassword123!")
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    private String newPassword;
}
