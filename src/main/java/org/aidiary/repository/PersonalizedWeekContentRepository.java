package org.aidiary.repository;

import org.aidiary.entity.PersonalizedWeekContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PersonalizedWeekContentRepository extends JpaRepository<PersonalizedWeekContent, Long> {

    Optional<PersonalizedWeekContent> findByUserIdAndWeekAndContextHash(Long userId, int week, String contextHash);

    List<PersonalizedWeekContent> findByUserIdAndWeek(Long userId, int week);
}
