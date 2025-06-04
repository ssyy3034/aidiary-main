package org.aidiary.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String phone;
    private String childName;
    private String childBirthday;

    private ChildDTO child; // 자녀 정보 포함
}