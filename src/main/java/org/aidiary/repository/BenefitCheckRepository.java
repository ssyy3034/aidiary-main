package org.aidiary.repository;

import org.aidiary.entity.BenefitCheck;
import org.aidiary.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BenefitCheckRepository extends JpaRepository<BenefitCheck, Long> {
    List<BenefitCheck> findByUser(User user);
    Optional<BenefitCheck> findByUserAndBenefitId(User user, Long benefitId);
}
