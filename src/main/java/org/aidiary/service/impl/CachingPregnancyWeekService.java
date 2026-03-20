package org.aidiary.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.response.PregnancyWeekDTO;
import org.aidiary.entity.PersonalizedWeekContent;
import org.aidiary.repository.PersonalizedWeekContentRepository;
import org.aidiary.service.PregnancyWeekCacheService;
import org.aidiary.service.UserContextService.UserContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class CachingPregnancyWeekService implements PregnancyWeekCacheService {

    private static final String KEY_PREFIX = "pregnancy:week:";
    private static final String NULL_MARKER = "__NULL__";

    private static final Set<Integer> VALID_WEEKS = IntStream.rangeClosed(1, 42).boxed()
            .collect(Collectors.toUnmodifiableSet());

    private final Cache<String, PregnancyWeekDTO> localCache = Caffeine.newBuilder()
            .maximumSize(200)
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    private final Cache<Integer, PregnancyWeekDTO> commonLocalCache = Caffeine.newBuilder()
            .maximumSize(42)
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final PersonalizedWeekContentRepository personalizedContentRepository;
    private final Random random = new Random();

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    @Override
    public PregnancyWeekDTO getPersonalizedWeekContent(UserContext ctx) {
        int week = ctx.week();

        if (!VALID_WEEKS.contains(week)) {
            blockInvalidWeek(week);
        }

        if (ctx.emotionSummary() == null && ctx.latestWeight() == null) {
            return getCommonWeekContent(week);
        }

        String cacheKey = ctx.userId() + ":" + ctx.contextHash();
        String redisKey = KEY_PREFIX + cacheKey;

        // 1. L1 Caffeine
        PregnancyWeekDTO local = localCache.getIfPresent(cacheKey);
        if (local != null) {
            log.debug("[L1 HIT] personalized: userId={}, week={}", ctx.userId(), week);
            return local;
        }

        // 2. L2 Redis
        try {
            String cached = redisTemplate.opsForValue().get(redisKey);
            if (cached != null) {
                PregnancyWeekDTO dto = objectMapper.readValue(cached, PregnancyWeekDTO.class);
                localCache.put(cacheKey, dto);
                log.debug("[L2 HIT] personalized: userId={}, week={}", ctx.userId(), week);
                return dto;
            }
        } catch (Exception e) {
            log.error("[L2] Redis 장애, DB로 Fallback: {}", e.getMessage());
        }

        // 3. L3 DB
        var dbOpt = personalizedContentRepository
                .findByUserIdAndWeekAndContextHash(ctx.userId(), week, ctx.contextHash());
        if (dbOpt.isPresent()) {
            try {
                PregnancyWeekDTO dto = objectMapper.readValue(dbOpt.get().getContent(), PregnancyWeekDTO.class);
                populateCache(cacheKey, redisKey, dto);
                log.debug("[DB HIT] personalized: userId={}, week={}", ctx.userId(), week);
                return dto;
            } catch (Exception e) {
                log.warn("[DB] JSON 파싱 실패, Flask 재호출: {}", e.getMessage());
            }
        }

        // 4. Flask(Gemini) 호출
        log.info("[MISS] Flask API 호출: userId={}, week={}", ctx.userId(), week);
        PregnancyWeekDTO dto = callFlaskWithContext(week, ctx);

        if (dto != null) {
            populateCache(cacheKey, redisKey, dto);
            persistToDb(ctx, dto);
        }

        return dto;
    }

    @Override
    public PregnancyWeekDTO getCommonWeekContent(int week) {
        String key = KEY_PREFIX + week;

        if (!VALID_WEEKS.contains(week)) {
            blockInvalidWeek(week);
        }

        // L1
        PregnancyWeekDTO local = commonLocalCache.getIfPresent(week);
        if (local != null) return local;

        // L2 Redis
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                PregnancyWeekDTO dto = objectMapper.readValue(cached, PregnancyWeekDTO.class);
                commonLocalCache.put(week, dto);
                return dto;
            }
        } catch (Exception e) {
            log.error("[L2] Redis 장애, Flask API로 Fallback: {}", e.getMessage());
        }

        // Flask GET (기존 방식)
        log.info("[MISS/FALLBACK] Flask API 호출: week={}", week);
        String url = flaskApiUrl + "/api/pregnancy/week-content?week=" + week;
        PregnancyWeekDTO dto = restTemplate.getForObject(url, PregnancyWeekDTO.class);

        if (dto != null) {
            try {
                long baseTtl = Duration.ofHours(24).getSeconds();
                long jitter = (long) (random.nextDouble() * Duration.ofHours(2).getSeconds());
                String json = objectMapper.writeValueAsString(dto);
                redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(baseTtl + jitter));
            } catch (Exception e) {
                log.warn("[SET] Redis 저장 실패: {}", e.getMessage());
            }
            commonLocalCache.put(week, dto);
        }

        return dto;
    }

    private PregnancyWeekDTO callFlaskWithContext(int week, UserContext ctx) {
        String url = flaskApiUrl + "/api/pregnancy/week-content";

        Map<String, Object> body = new HashMap<>();
        body.put("week", week);

        Map<String, Object> context = new HashMap<>();
        context.put("emotionSummary", ctx.emotionSummary());
        if (ctx.latestWeight() != null) {
            context.put("weight", ctx.latestWeight());
        }
        if (ctx.latestSystolic() != null && ctx.latestDiastolic() != null) {
            context.put("bloodPressure", ctx.latestSystolic() + "/" + ctx.latestDiastolic());
        }
        body.put("context", context);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return restTemplate.postForObject(url, new HttpEntity<>(body, headers), PregnancyWeekDTO.class);
    }

    private void populateCache(String cacheKey, String redisKey, PregnancyWeekDTO dto) {
        localCache.put(cacheKey, dto);
        try {
            long baseTtl = Duration.ofHours(24).getSeconds();
            long jitter = (long) (random.nextDouble() * Duration.ofHours(2).getSeconds());
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(redisKey, json, Duration.ofSeconds(baseTtl + jitter));
        } catch (Exception e) {
            log.warn("[SET] Redis 저장 실패: {}", e.getMessage());
        }
    }

    private void persistToDb(UserContext ctx, PregnancyWeekDTO dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            PersonalizedWeekContent entity = PersonalizedWeekContent.builder()
                    .userId(ctx.userId())
                    .week(ctx.week())
                    .contextHash(ctx.contextHash())
                    .content(json)
                    .build();
            personalizedContentRepository.save(entity);
        } catch (Exception e) {
            log.warn("[DB] 영속화 실패 (서비스 영향 없음): {}", e.getMessage());
        }
    }

    private void blockInvalidWeek(int week) {
        try {
            String badKey = "bad:" + KEY_PREFIX + week;
            String marker = redisTemplate.opsForValue().get(badKey);
            if (NULL_MARKER.equals(marker)) {
                throw new IllegalArgumentException("유효하지 않은 임신 주차: " + week);
            }
            redisTemplate.opsForValue().set(badKey, NULL_MARKER, Duration.ofMinutes(5));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Penetration] Redis 연결 실패: {}", e.getMessage());
        }
        throw new IllegalArgumentException("유효하지 않은 임신 주차: " + week);
    }

    @Override
    public void warmup() {
        log.info("임신 주차 공통 콘텐츠 사전 로딩 시작");
        int loaded = 0;
        for (int week = 1; week <= 42; week++) {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + week))) {
                continue;
            }
            try {
                getCommonWeekContent(week);
                loaded++;
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.warn("[Warmup] week:{} 로딩 실패: {}", week, e.getMessage());
            }
        }
        log.info("사전 로딩 완료: {}개 신규", loaded);
    }
}
