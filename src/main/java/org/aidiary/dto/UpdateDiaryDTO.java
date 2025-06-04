// UpdateDiaryDTO.java
package org.aidiary.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDiaryDTO {

    @Size(max = 100)
    private String title;

    private String content;

    private String emotion;
}
