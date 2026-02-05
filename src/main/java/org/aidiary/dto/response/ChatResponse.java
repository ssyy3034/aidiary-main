package org.aidiary.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatResponse {
    private String response;
    private boolean success;
    private String error;

    public static ChatResponse success(String response) {
        return ChatResponse.builder()
                .success(true)
                .response(response)
                .build();
    }

    public static ChatResponse error(String error) {
        return ChatResponse.builder()
                .success(false)
                .error(error)
                .build();
    }
}
