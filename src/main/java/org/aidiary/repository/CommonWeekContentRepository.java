package org.aidiary.repository;

import org.aidiary.entity.CommonWeekContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommonWeekContentRepository extends JpaRepository<CommonWeekContent, Long> {
    Optional<CommonWeekContent> findByWeek(int week);
}
