package org.aidiary.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.response.PregnancyWeekDTO;
import org.aidiary.entity.CommonWeekContent;
import org.aidiary.entity.PersonalizedWeekContent;
import org.aidiary.repository.CommonWeekContentRepository;
import org.aidiary.repository.PersonalizedWeekContentRepository;
import org.aidiary.service.PregnancyWeekCacheService;
import org.aidiary.service.UserContextService.UserContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final CommonWeekContentRepository commonContentRepository;
    private final Random random = new Random();

    @Value("${api.flask.url}")
    private String flaskApiUrl;

    @Value("${app.cache.enabled:true}")
    private boolean cacheEnabled;

    @Override
    public PregnancyWeekDTO getPersonalizedWeekContent(UserContext ctx) {
        int week = ctx.week();
        validateWeek(week);

        if (ctx.isMissingContext()) {
            return getCommonWeekContent(week);
        }

        String cacheKey = generateCacheKey(ctx);
        String redisKey = KEY_PREFIX + cacheKey;

        return lookupPersonalizedCache(cacheKey, redisKey)
                .or(() -> lookupPersonalizedDb(ctx))
                .orElseGet(() -> fetchPersonalizedFromApi(week, ctx, cacheKey, redisKey));
    }

    @Override
    public PregnancyWeekDTO getCommonWeekContent(int week) {
        String key = KEY_PREFIX + week;
        validateWeek(week);

        return lookupCommonLocalCache(week)
                .or(() -> lookupCommonRedisCache(key, week))
                .or(() -> lookupCommonDb(week))
                .orElseGet(() -> fetchCommonFromApi(week, key));
    }

    // --- Private Helper Methods (Separation of Concerns) ---

    private void validateWeek(int week) {
        if (!VALID_WEEKS.contains(week)) {
            blockInvalidWeek(week);
        }
    }

    private String generateCacheKey(UserContext ctx) {
        return ctx.userId() + ":" + ctx.week() + ":" + ctx.contextHash();
    }

    private Optional<PregnancyWeekDTO> lookupPersonalizedCache(String cacheKey, String redisKey) {
        if (!cacheEnabled) return Optional.empty();

        return Optional.ofNullable(localCache.getIfPresent(cacheKey))
                .or(() -> {
                    Optional<PregnancyWeekDTO> redisDto = fetchFromRedis(redisKey);
                    redisDto.ifPresent(dto -> localCache.put(cacheKey, dto));
                    return redisDto;
                });
    }

    private Optional<PregnancyWeekDTO> lookupCommonLocalCache(int week) {
        return cacheEnabled ? Optional.ofNullable(commonLocalCache.getIfPresent(week)) : Optional.empty();
    }

    private Optional<PregnancyWeekDTO> lookupCommonRedisCache(String key, int week) {
        if (!cacheEnabled) return Optional.empty();
        return fetchFromRedis(key).map(dto -> {
            commonLocalCache.put(week, dto);
            return dto;
        });
    }

    private Optional<PregnancyWeekDTO> lookupPersonalizedDb(UserContext ctx) {
        return personalizedContentRepository.findByUserIdAndWeekAndContextHash(ctx.userId(), ctx.week(), ctx.contextHash())
                .flatMap(entity -> parseContent(entity.getContent()));
    }

    private Optional<PregnancyWeekDTO> lookupCommonDb(int week) {
        return commonContentRepository.findByWeek(week).flatMap(entity -> parseContent(entity.getContent()));
    }

    private PregnancyWeekDTO fetchPersonalizedFromApi(int week, UserContext ctx, String cacheKey, String redisKey) {
        log.info("[MISS] Personalized API 호출: userId={}, week={}", ctx.userId(), week);
        PregnancyWeekDTO dto = callFlaskWithContext(week, ctx);
        if (dto != null) {
            saveToCache(cacheKey, redisKey, dto);
            persistToDb(ctx, dto);
        }
        return dto;
    }

    private PregnancyWeekDTO fetchCommonFromApi(int week, String key) {
        log.info("[MISS/FALLBACK] Common API 호출: week={}", week);
        String url = flaskApiUrl + "/api/pregnancy/week-content?week=" + week;
        try {
            PregnancyWeekDTO dto = callCommonFlaskWithCircuitBreaker(url);
            if (dto != null) {
                saveCommonToDb(week, dto);
                saveCommonToCache(key, week, dto);
            }
            return dto;
        } catch (Exception e) {
            log.error("[CircuitBreaker] Flask 공통 콘텐츠 호출 실패: {}", e.getMessage());
            return null;
        }
    }

    private Optional<PregnancyWeekDTO> fetchFromRedis(String key) {
        try {
            String cached = redisTemplate.opsForValue().get(key);
            return cached != null ? Optional.ofNullable(objectMapper.readValue(cached, PregnancyWeekDTO.class)) : Optional.empty();
        } catch (Exception e) {
            log.warn("[L2] Redis 조회 에러: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<PregnancyWeekDTO> parseContent(String content) {
        try {
            return Optional.ofNullable(objectMapper.readValue(content, PregnancyWeekDTO.class));
        } catch (Exception e) {
            log.warn("[DB] JSON 파싱 에러: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private void saveToCache(String cacheKey, String redisKey, PregnancyWeekDTO dto) {
        if (!cacheEnabled) return;
        localCache.put(cacheKey, dto);
        writeToRedis(redisKey, dto);
    }

    private void saveCommonToCache(String key, int week, PregnancyWeekDTO dto) {
        if (!cacheEnabled) return;
        commonLocalCache.put(week, dto);
        writeToRedis(key, dto);
    }

    private void writeToRedis(String key, PregnancyWeekDTO dto) {
        try {
            long ttl = Duration.ofHours(24).getSeconds() + (long) (random.nextDouble() * 7200);
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(dto), Duration.ofSeconds(ttl));
        } catch (Exception e) {
            log.warn("[REDIS] 저장 실패: {}", e.getMessage());
        }
    }

    @CircuitBreaker(name = "flaskApi", fallbackMethod = "fallbackFlaskWithContext")
    private PregnancyWeekDTO callFlaskWithContext(int week, UserContext ctx) {
        String url = flaskApiUrl + "/api/pregnancy/week-content";
        Map<String, Object> body = Map.of(
            "week", week,
            "context", ctx.toMap()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.postForObject(url, new HttpEntity<>(body, headers), PregnancyWeekDTO.class);
    }

    private PregnancyWeekDTO fallbackFlaskWithContext(int week, UserContext ctx, Throwable t) {
        log.warn("[Fallback] API 실패. 공통 콘텐츠로 대체: {}", t.getMessage());
        return getCommonWeekContent(week);
    }

    @CircuitBreaker(name = "flaskApi")
    private PregnancyWeekDTO callCommonFlaskWithCircuitBreaker(String url) {
        return restTemplate.getForObject(url, PregnancyWeekDTO.class);
    }

    private void persistToDb(UserContext ctx, PregnancyWeekDTO dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            personalizedContentRepository.findByUserIdAndWeek(ctx.userId(), ctx.week())
                    .stream().findFirst()
                    .map(existing -> {
                        existing.setContextHash(ctx.contextHash());
                        existing.setContent(json);
                        return existing;
                    })
                    .or(() -> Optional.of(PersonalizedWeekContent.builder()
                            .userId(ctx.userId())
                            .week(ctx.week())
                            .contextHash(ctx.contextHash())
                            .content(json)
                            .build()))
                    .ifPresent(personalizedContentRepository::save);
        } catch (Exception e) {
            log.warn("[DB] 개인화 영속화 실패: {}", e.getMessage());
        }
    }

    private void saveCommonToDb(int week, PregnancyWeekDTO dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            commonContentRepository.findByWeek(week)
                    .map(existing -> {
                        existing.setContent(json);
                        return existing;
                    })
                    .or(() -> Optional.of(CommonWeekContent.builder()
                            .week(week)
                            .content(json)
                            .build()))
                    .ifPresent(commonContentRepository::save);
        } catch (Exception e) {
            log.warn("[DB] 공통 영속화 실패: {}", e.getMessage());
        }
    }

    private void blockInvalidWeek(int week) {
        String badKey = "bad:" + KEY_PREFIX + week;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(badKey))) {
            throw new IllegalArgumentException("유효하지 않은 주차: " + week);
        }
        redisTemplate.opsForValue().set(badKey, NULL_MARKER, Duration.ofMinutes(5));
        throw new IllegalArgumentException("유효하지 않은 주차: " + week);
    }

    @Override
    public void warmup() {
        log.info("임신 주차 콘텐츠 사전 로딩 시작");
        VALID_WEEKS.forEach(week -> {
            if (Boolean.FALSE.equals(redisTemplate.hasKey(KEY_PREFIX + week))) {
                getCommonWeekContent(week);
            }
        });
        log.info("Warmup 완료");
    }
}
