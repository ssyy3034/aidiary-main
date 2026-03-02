package org.aidiary.repository;

import org.aidiary.entity.PersonalizedWeekContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonalizedWeekContentRepository extends JpaRepository<PersonalizedWeekContent, Long> {

    Optional<PersonalizedWeekContent> findByUserIdAndWeekAndContextHash(Long userId, int week, String contextHash);
}
