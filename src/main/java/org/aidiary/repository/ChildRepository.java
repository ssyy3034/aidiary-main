package org.aidiary.repository;

import org.aidiary.entity.Child;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ChildRepository extends JpaRepository<Child, Long> {
    // findByUserId 메소드 제거
}