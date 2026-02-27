package org.aidiary.repository;

import org.aidiary.entity.HealthMetric;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {

    List<HealthMetric> findByUserIdOrderByRecordDateDesc(Long userId, Pageable pageable);

    Optional<HealthMetric> findTopByUserIdOrderByRecordDateDesc(Long userId);

    Optional<HealthMetric> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);
}
