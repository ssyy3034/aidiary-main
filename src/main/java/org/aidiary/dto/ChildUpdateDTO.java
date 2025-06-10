package org.aidiary.dto;

import lombok.Data;

@Data
public class ChildUpdateDTO {
    private String childName;
    private String childBirthday; // 또는 meetDate로 명확히
    private String gptResponse; // optional
}
