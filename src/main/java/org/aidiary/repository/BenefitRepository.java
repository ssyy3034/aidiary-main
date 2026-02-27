package org.aidiary.repository;

import org.aidiary.entity.Benefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BenefitRepository extends JpaRepository<Benefit, Long> {
    List<Benefit> findByRecommendedWeekStartLessThanEqualAndRecommendedWeekEndGreaterThanEqualOrderByRecommendedWeekStartAsc(int endWeek, int startWeek);
}
