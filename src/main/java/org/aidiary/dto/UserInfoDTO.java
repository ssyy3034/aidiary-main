package org.aidiary.dto;

import lombok.Data;
import org.aidiary.entity.User;

@Data
public class UserInfoDTO {

    private Long id;

    private String username;
    private String email;
    private String phone;
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
