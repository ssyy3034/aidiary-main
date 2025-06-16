package org.aidiary.repository;

import org.aidiary.entity.Diary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {
    Page<Diary> findAllByUserId(Long userId, Pageable pageable); // ✅ 올바른 반환 타입
}
