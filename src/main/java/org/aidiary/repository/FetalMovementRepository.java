package org.aidiary.repository;

import org.aidiary.entity.FetalMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FetalMovementRepository extends JpaRepository<FetalMovement, Long> {

    Page<FetalMovement> findByUserIdOrderByMovementTimeDesc(Long userId, Pageable pageable);

    List<FetalMovement> findByUserIdAndMovementTimeBetweenOrderByMovementTimeAsc(
            Long userId, LocalDateTime from, LocalDateTime to);

    long countByUserIdAndMovementTimeBetween(Long userId, LocalDateTime from, LocalDateTime to);
}
