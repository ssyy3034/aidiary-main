package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.FetalMovementRequest;
import org.aidiary.dto.response.FetalMovementDTO;
import org.aidiary.dto.response.FetalMovementSummaryDTO;
import org.aidiary.entity.FetalMovement;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.FetalMovementRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FetalMovementService {

    private final FetalMovementRepository fetalMovementRepository;
    private final UserRepository userRepository;

    @Transactional
    public FetalMovementDTO log(Long userId, FetalMovementRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        FetalMovement entity = FetalMovement.builder()
                .user(user)
                .movementTime(request.getMovementTime())
                .intensity(request.getIntensity())
                .notes(request.getNotes())
                .build();

        return FetalMovementDTO.fromEntity(fetalMovementRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public FetalMovementSummaryDTO getTodaySummary(Long userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<FetalMovement> todayList = fetalMovementRepository
                .findByUserIdAndMovementTimeBetweenOrderByMovementTimeAsc(userId, startOfDay, endOfDay);

        int maxIntensity = todayList.stream()
                .mapToInt(FetalMovement::getIntensity)
                .max()
                .orElse(0);

        List<FetalMovementDTO> dtos = todayList.stream()
                .map(FetalMovementDTO::fromEntity)
                .collect(Collectors.toList());

        return FetalMovementSummaryDTO.builder()
                .todayCount(todayList.size())
                .todayMaxIntensity(maxIntensity)
                .todayMovements(dtos)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<FetalMovementDTO> getHistory(Long userId, LocalDate date, int page, int size) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<FetalMovement> all = fetalMovementRepository
                .findByUserIdAndMovementTimeBetweenOrderByMovementTimeAsc(userId, start, end);

        // 역순 (최신순)
        List<FetalMovementDTO> dtos = all.stream()
                .sorted((a, b) -> b.getMovementTime().compareTo(a.getMovementTime()))
                .map(FetalMovementDTO::fromEntity)
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size);
        int from = (int) pageable.getOffset();
        int to = Math.min(from + size, dtos.size());
        List<FetalMovementDTO> pageContent = from >= dtos.size()
                ? List.of()
                : dtos.subList(from, to);

        return new PageImpl<>(pageContent, pageable, dtos.size());
    }

    @Transactional
    public void delete(Long userId, Long id) {
        FetalMovement entity = fetalMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FetalMovement", id));

        if (!entity.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 태동 기록만 삭제할 수 있습니다.");
        }

        fetalMovementRepository.deleteById(id);
    }
}
