package org.aidiary.dto;

import lombok.Data;
import org.aidiary.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Schema(description = "사용자 정보 응답 DTO")
public class UserInfoDTO {

    @Schema(description = "사용자 고유 ID", example = "10")
    private Long id;

    @Schema(description = "사용자 아이디", example = "dongha123")
    private String username;

    @Schema(description = "이메일 주소", example = "test@example.com")
    private String email;

    @Schema(description = "전화번호", example = "010-1234-5678")
    private String phone;

    @Schema(description = "관련 아이 정보")
    private ChildDTO child;

    public UserInfoDTO(User user) {
        if (user != null) {
            System.out.println(
                    "DEBUG: UserInfoDTO constructor called for user: " + user.getUsername() + ", ID: " + user.getId());
            this.id = user.getId();
            this.username = user.getUsername();
            this.email = user.getEmail();
            this.phone = user.getPhone();
            this.child = user.getChild() != null ? new ChildDTO(user.getChild()) : null;
        }
    }
}
