// CreateDiaryDTO.java
package org.aidiary.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateDiaryDTO {
    private String title;
    private String content;
    private String emotion;
}
