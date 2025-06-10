package org.aidiary.dto;

import lombok.Data;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;

import java.util.List;

@Data
public class UserInfoDTO {

    private Long id;

    private String username;
    private String email;
    private String phone;
    private Child child;

    public UserInfoDTO(User user) {
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.child = user.getChild();
    }
}


