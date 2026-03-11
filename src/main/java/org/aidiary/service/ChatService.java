package org.aidiary.service;

import org.aidiary.dto.request.ChatRequest;
import org.aidiary.dto.response.ChatResponse;

public interface ChatService {

    ChatResponse generateCharacterResponse(ChatRequest request, String personality,
            String childName, int weeks, String userName, String recentDiary);
}
