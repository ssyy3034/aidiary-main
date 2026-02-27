package org.aidiary.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.response.PregnancyWeekDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class PregnancyWeekCacheService {

    private static final String KEY_PREFIX = "pregnancy:week:";
    private static final String NULL_MARKER = "__NULL__";

    // ── Cache Penetration 방어 ────────────────────────────────────────────
    // 유효 주차(1~42) 집합으로 O(1) 선차단. 유효하지 않은 주차 요청은
    // Redis/Flask 조회 없이 즉시 차단하고, 반복 공격 대비 null 마커를 5분 캐싱.
    private static final Set<Integer> VALID_WEEKS =
            IntStream.rangeClosed(1, 42).boxed().collect(Collectors.toUnmodifiableSet());

    // ── Hot Key 방어 (L1 로컬 캐시) ──────────────────────────────────────
    // 같은 주차 사용자가 집중하면 단일 Redis 키에 요청이 몰림.
    // JVM당 Caffeine 로컬 캐시(2분 TTL)로 Redis 부하 분산.
    // 42개 이상 쌓일 일이 없으므로 maximumSize = 42.
    private final Cache<Integer, PregnancyWeekDTO> localCache = Caffeine.newBuilder()
            .maximumSize(42)
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    /**
     * 임신 주차별 AI 콘텐츠를 3단계 캐시 전략으로 반환한다.
     *
     * <ol>
     *   <li>Cache Penetration 방어: 유효 주차 집합 선차단 + null 마커 캐싱</li>
     *   <li>L1 Caffeine 로컬 캐시 (Hot Key 방어): JVM당, 2분 TTL</li>
     *   <li>L2 Redis 캐시 (공유): Jitter TTL 24h±2h (Avalanche 방어)</li>
     *   <li>MISS 시 Flask → Gemini API 호출</li>
     * </ol>
     */
    public PregnancyWeekDTO getWeekContent(int week) {

        // 1. Cache Penetration 방어 ──────────────────────────────────────
        if (!VALID_WEEKS.contains(week)) {
            String badKey = KEY_PREFIX + week;
            String marker = redisTemplate.opsForValue().get(badKey);
            if (NULL_MARKER.equals(marker)) {
                log.debug("[Penetration Block] week:{} — null marker hit", week);
                throw new IllegalArgumentException("유효하지 않은 임신 주차: " + week);
            }
            // 처음 들어온 유효하지 않은 요청: null 마커를 5분 캐싱 후 차단
            redisTemplate.opsForValue().set(badKey, NULL_MARKER, Duration.ofMinutes(5));
            log.warn("[Penetration Guard] week:{} — null marker cached (5min)", week);
            throw new IllegalArgumentException("유효하지 않은 임신 주차: " + week);
        }

        // 2. L1 로컬 캐시 확인 (Hot Key 방어) ────────────────────────────
        PregnancyWeekDTO local = localCache.getIfPresent(week);
        if (local != null) {
            log.debug("[L1 HIT] week:{}", week);
            return local;
        }

        // 3. L2 Redis 캐시 확인 ──────────────────────────────────────────
        String key = KEY_PREFIX + week;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                PregnancyWeekDTO dto = objectMapper.readValue(cached, PregnancyWeekDTO.class);
                log.debug("[L2 HIT] week:{}", week);
                localCache.put(week, dto);
                return dto;
            } catch (Exception e) {
                log.warn("[L2] 역직렬화 실패 week:{}, 재생성: {}", week, e.getMessage());
            }
        }

        // 4. Cache MISS → Flask(Gemini AI) 호출 ─────────────────────────
        log.info("[MISS] week:{} — calling Flask/Gemini API (~500ms)", week);
        String url = flaskApiUrl + "/api/pregnancy/week-content?week=" + week;
        PregnancyWeekDTO dto = restTemplate.getForObject(url, PregnancyWeekDTO.class);

        // 5. Cache Avalanche 방어: TTL Jitter ────────────────────────────
        // 서버 재시작 후 42주 일괄 warmup 시 동일 TTL이면 24시간 후 동시 만료.
        // ±최대 2시간 랜덤 Jitter로 만료 시점을 분산.
        long baseTtl = Duration.ofHours(24).getSeconds();
        long jitter   = (long) (random.nextDouble() * Duration.ofHours(2).getSeconds());
        try {
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(baseTtl + jitter));
            log.info("[SET] week:{}, ttl={}s (base={}s jitter={}s)",
                    week, baseTtl + jitter, baseTtl, jitter);
        } catch (Exception e) {
            log.warn("[SET] 직렬화 실패 week:{}: {}", week, e.getMessage());
        }

        localCache.put(week, dto);
        return dto;
    }

    /**
     * 서버 시작 시 42주 전체를 사전 로딩한다.
     *
     * <p>이미 캐시된 주차는 건너뛰고, Gemini API 과부하 방지를 위해
     * 각 주차 사이 200ms 간격을 둔다. 각 키에 Jitter TTL이 적용되므로
     * 모든 키가 동시에 만료되는 Cache Avalanche를 방지한다.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void warmup() {
        log.info("[Warmup] 임신 주차 콘텐츠 사전 로딩 시작 (42주)");
        int loaded = 0;
        for (int week = 1; week <= 42; week++) {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + week))) {
                continue;
            }
            try {
                getWeekContent(week);
                loaded++;
                Thread.sleep(200);  // Gemini rate limit 보호
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.warn("[Warmup] week:{} 로딩 실패: {}", week, e.getMessage());
            }
        }
        log.info("[Warmup] 완료 — {}개 신규 로딩", loaded);
    }
}
