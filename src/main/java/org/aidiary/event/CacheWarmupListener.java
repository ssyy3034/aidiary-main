package org.aidiary.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.PregnancyWeekCacheService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheWarmupListener {

    private final PregnancyWeekCacheService pregnancyWeekCacheService;

    @EventListener(ApplicationReadyEvent.class)
    @Async("imageTaskExecutor")
    public void onApplicationReady() {
        log.info("임신 주차 공통 콘텐츠 사전 로딩 시작 (Listener)");
        pregnancyWeekCacheService.warmup();
        log.info("사전 로딩 프로세스 종료 (Listener)");
    }
}
