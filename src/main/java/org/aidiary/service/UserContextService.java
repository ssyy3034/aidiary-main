package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.entity.HealthMetric;
import org.aidiary.repository.DiaryRepository;
import org.aidiary.repository.HealthMetricRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserContextService {

    private final DiaryRepository diaryRepository;
    private final HealthMetricRepository healthMetricRepository;

    public record UserContext(
            int week,
            Long userId,
            List<String> recentEmotions,
            String emotionSummary,
            Double latestWeight,
            Integer latestSystolic,
            Integer latestDiastolic,
            String contextHash
    ) {}

    public UserContext buildContext(Long userId, int week) {
        // 최근 7일 감정 라벨 조회
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<String> recentEmotions = diaryRepository.findRecentEmotionsByUserId(userId, sevenDaysAgo);

        // 감정 요약 생성
        String emotionSummary = summarizeEmotions(recentEmotions);

        // 최근 건강 데이터 조회
        Double latestWeight = null;
        Integer latestSystolic = null;
        Integer latestDiastolic = null;

        var healthOpt = healthMetricRepository.findTopByUserIdOrderByRecordDateDesc(userId);
        if (healthOpt.isPresent()) {
            HealthMetric hm = healthOpt.get();
            latestWeight = hm.getWeight();
            latestSystolic = hm.getSystolic();
            latestDiastolic = hm.getDiastolic();
        }

        // 컨텍스트 해시 생성
        String hash = generateContextHash(userId, week, recentEmotions, latestWeight, latestSystolic);

        return new UserContext(week, userId, recentEmotions, emotionSummary,
                latestWeight, latestSystolic, latestDiastolic, hash);
    }

    private String summarizeEmotions(List<String> emotions) {
        if (emotions.isEmpty()) {
            return null;
        }

        Map<String, Long> freq = emotions.stream()
                .collect(Collectors.groupingBy(e -> e, Collectors.counting()));

        long total = emotions.size();
        long sadCount = freq.getOrDefault("sad", 0L);
        long happyCount = freq.getOrDefault("happy", 0L);
        long calmCount = freq.getOrDefault("calm", 0L);

        // 빈도 기반 요약 텍스트
        String freqText = freq.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> e.getKey() + " " + e.getValue() + "회")
                .collect(Collectors.joining(", "));

        if (sadCount > total / 2) {
            return "최근 부정적 감정이 자주 나타남 (" + freqText + ")";
        } else if (happyCount > total / 2) {
            return "최근 긍정적 감정이 주를 이룸 (" + freqText + ")";
        } else {
            return "최근 감정 경향: " + freqText;
        }
    }

    private String generateContextHash(Long userId, int week, List<String> emotions,
                                        Double weight, Integer systolic) {
        String raw = userId + ":" + week + ":" + emotions.toString()
                + ":" + weight + ":" + systolic;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
