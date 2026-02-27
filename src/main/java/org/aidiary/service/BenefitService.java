package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.response.BenefitDTO;
import org.aidiary.entity.Benefit;
import org.aidiary.entity.BenefitCheck;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.BenefitCheckRepository;
import org.aidiary.repository.BenefitRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BenefitService {

    private final BenefitRepository benefitRepository;
    private final BenefitCheckRepository benefitCheckRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BenefitDTO> getBenefitsForWeek(Long userId, int week) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Get all benefits that are recommended for the current week or earlier
        // It's good to show benefits they might have missed, or ones currently active.
        List<Benefit> benefits = benefitRepository.findByRecommendedWeekStartLessThanEqualAndRecommendedWeekEndGreaterThanEqualOrderByRecommendedWeekStartAsc(week, week);

        // Fetch user's checks to see what they have completed
        List<BenefitCheck> checks = benefitCheckRepository.findByUser(user);
        Map<Long, Boolean> checkMap = checks.stream()
                .collect(Collectors.toMap(c -> c.getBenefit().getId(), BenefitCheck::isCompleted));

        return benefits.stream()
                .map(b -> BenefitDTO.fromEntity(b, checkMap.getOrDefault(b.getId(), false)))
                .collect(Collectors.toList());
    }

    @Transactional
    public BenefitDTO toggleBenefitCheck(Long userId, Long benefitId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Benefit benefit = benefitRepository.findById(benefitId)
                .orElseThrow(() -> new ResourceNotFoundException("Benefit", benefitId));

        BenefitCheck check = benefitCheckRepository.findByUserAndBenefitId(user, benefitId)
                .orElse(BenefitCheck.builder()
                        .user(user)
                        .benefit(benefit)
                        .completed(false)
                        .build());

        check.setCompleted(!check.isCompleted());
        BenefitCheck saved = benefitCheckRepository.save(check);

        return BenefitDTO.fromEntity(benefit, saved.isCompleted());
    }
}
