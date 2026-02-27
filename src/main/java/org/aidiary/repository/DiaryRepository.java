package org.aidiary.repository;

import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /**
     * 일기 목록 조회 — DTO Projection.
     *
     * Entity를 거치지 않고 필요한 컬럼만 SELECT하여 DTO로 직접 매핑한다.
     * DiaryResponseDTO가 user 데이터를 사용하지 않으므로 JOIN이 발생하지 않는다.
     * (EntityGraph/Fetch Join 기반 접근 대비 불필요한 LEFT JOIN 제거)
     */
    @Query("SELECT new org.aidiary.dto.response.DiaryResponseDTO(d.id, d.title, d.content, d.emotion, d.createdAt, d.updatedAt) " +
           "FROM Diary d WHERE d.user.id = :userId ORDER BY d.createdAt DESC")
    Page<DiaryResponseDTO> findDiaryDTOsByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 소유자 검증이 필요한 수정/삭제 시 사용.
     * @EntityGraph로 user를 JOIN FETCH하여 소유권 확인 쿼리를 1회로 줄인다.
     */
    @EntityGraph(attributePaths = { "user" })
    Optional<Diary> findWithUserById(Long id);
}
