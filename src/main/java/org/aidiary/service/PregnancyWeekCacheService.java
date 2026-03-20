package org.aidiary.service;

import org.aidiary.dto.response.PregnancyWeekDTO;
import org.aidiary.service.UserContextService.UserContext;

public interface PregnancyWeekCacheService {

    PregnancyWeekDTO getPersonalizedWeekContent(UserContext ctx);

    PregnancyWeekDTO getCommonWeekContent(int week);
    
    void warmup();
}
