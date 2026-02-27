package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.HealthMetricRequest;
import org.aidiary.dto.response.HealthMetricDTO;
import org.aidiary.entity.HealthMetric;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.HealthMetricRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HealthMetricService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;

    @Transactional
    public HealthMetricDTO save(Long userId, HealthMetricRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        LocalDate recordDate = request.getRecordDate() != null
                ? request.getRecordDate()
                : LocalDate.now();

        // 같은 날짜면 업데이트
        HealthMetric metric = healthMetricRepository
                .findByUserIdAndRecordDate(userId, recordDate)
                .orElseGet(() -> HealthMetric.builder()
                        .user(user)
                        .recordDate(recordDate)
                        .build());

        metric.setWeight(request.getWeight());
        metric.setSystolic(request.getSystolic());
        metric.setDiastolic(request.getDiastolic());

        return HealthMetricDTO.fromEntity(healthMetricRepository.save(metric));
    }

    @Transactional(readOnly = true)
    public List<HealthMetricDTO> getHistory(Long userId) {
        Pageable pageable = PageRequest.of(0, 10);
        return healthMetricRepository.findByUserIdOrderByRecordDateDesc(userId, pageable)
                .stream()
                .map(HealthMetricDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<HealthMetricDTO> getLatest(Long userId) {
        return healthMetricRepository.findTopByUserIdOrderByRecordDateDesc(userId)
                .map(HealthMetricDTO::fromEntity);
    }
}
