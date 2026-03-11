package org.aidiary.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.aidiary.dto.ChildDTO;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "인증 성공 응답 DTO")
public class AuthResponse {
    @Schema(description = "JWT 액세스 토큰")
    private String token;
    @Schema(description = "사용자 아이디", example = "dongha123")
    private String username;
    @Schema(description = "이메일 주소", example = "test@example.com")
    private String email;
    @Schema(description = "사용자 권한", example = "ROLE_USER")
    private String role;
    @Schema(description = "사용자 고유 ID", example = "10")
    private Long id;
    @Schema(description = "연동된 아이 정보")
    private ChildDTO child;
}
