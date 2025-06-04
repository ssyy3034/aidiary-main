package org.aidiary.dto;

import lombok.Data;
import org.aidiary.entity.User;

import java.util.List;

@Data
public class UserInfoDTO {

    private String username;
    private String email;
    private String phone;
    private List<ChildDTO> children;

    public UserInfoDTO(User user) {
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.children = user.getChildren().stream().map(ChildDTO::new).toList();
    }
}


