package org.aidiary.repository;

import org.aidiary.entity.Child;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChildRepository extends JpaRepository<Child, Long> {
    Optional<Child> findByUser_Id(Long userId);  // ✅ 수정: user의 id를 기준으로 자녀 검색
}
