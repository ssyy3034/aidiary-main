package org.aidiary.repository;

import org.aidiary.entity.BenefitCheck;
import org.aidiary.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BenefitCheckRepository extends JpaRepository<BenefitCheck, Long> {

    /**
     * benefit JOIN FETCH: BenefitService에서 c.getBenefit().getId()를 호출하므로
     * Benefit을 함께 로딩하여 Hibernate 프록시 초기화 여부에 대한 구현 의존성을 제거한다.
     */
    @Query("SELECT bc FROM BenefitCheck bc JOIN FETCH bc.benefit WHERE bc.user = :user")
    List<BenefitCheck> findByUser(@Param("user") User user);

    Optional<BenefitCheck> findByUserAndBenefitId(User user, Long benefitId);
}
