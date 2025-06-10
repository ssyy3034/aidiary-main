package org.aidiary.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String phone;
    private ChildUpdateDTO child; // ✅ 자녀 정보는 여기서만!
}
