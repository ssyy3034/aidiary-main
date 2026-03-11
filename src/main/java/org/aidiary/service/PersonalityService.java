package org.aidiary.service;

import java.util.Map;

public interface PersonalityService {

    Map<String, Object> chat(Map<String, Object> payload);

    Map<String, Object> synthesize(Map<String, Object> payload);
}
