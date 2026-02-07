package org.aidiary.repository;

import org.aidiary.entity.Diary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /**
     * 사용자 ID로 페이지네이션된 일기 조회 (N+1 문제 방지)
     */
    @EntityGraph(attributePaths = { "user" })
    Page<Diary> findAllByUserId(Long userId, Pageable pageable);

    /**
     * 일기 ID로 사용자 정보와 함께 조회 (N+1 문제 방지)
     */
    @EntityGraph(attributePaths = { "user" })
    Optional<Diary> findWithUserById(Long id);

    /**
     * 특정 사용자의 모든 일기 조회 (Fetch Join 사용)
     */
    @Query("SELECT d FROM Diary d JOIN FETCH d.user WHERE d.user.id = :userId")
    List<Diary> findAllByUserIdWithUser(@Param("userId") Long userId);
}
