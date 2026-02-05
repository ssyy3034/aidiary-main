package org.aidiary.dto.request;

import lombok.Data;

@Data
public class ChatRequest {
    private String message;
    private String context; // 이전 대화 맥락 (선택적)
}
