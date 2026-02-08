package org.aidiary.service;

import org.aidiary.dto.CreateDiaryDTO;
import org.aidiary.dto.response.DiaryResponseDTO;
import org.aidiary.entity.Diary;
import org.aidiary.entity.User;
import org.aidiary.repository.DiaryRepository;
import org.aidiary.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

/**
 * DiaryService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
class DiaryServiceTest {

    @Mock
    private DiaryRepository diaryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DiaryService diaryService;

    private User testUser;
    private Diary testDiary;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@test.com")
                .build();

        testDiary = Diary.builder()
                .id(1L)
                .title("테스트 일기")
                .content("테스트 내용")
                .emotion("happy")
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("일기 생성 테스트")
    class CreateDiaryTest {

        @Test
        @DisplayName("성공: 일기가 정상적으로 생성된다")
        void createDiary_success() {
            // given
            CreateDiaryDTO dto = new CreateDiaryDTO();
            dto.setTitle("새 일기");
            dto.setContent("새 내용");
            dto.setEmotion("happy");

            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(diaryRepository.save(any(Diary.class))).willReturn(testDiary);

            // when
            DiaryResponseDTO result = diaryService.createDiary(dto, 1L);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("테스트 일기");
            verify(diaryRepository).save(any(Diary.class));
        }

        @Test
        @DisplayName("실패: 존재하지 않는 사용자")
        void createDiary_userNotFound() {
            // given
            CreateDiaryDTO dto = new CreateDiaryDTO();
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> diaryService.createDiary(dto, 999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("일기 수정 테스트")
    class UpdateDiaryTest {

        @Test
        @DisplayName("성공: 본인의 일기를 수정한다")
        void updateDiary_success() {
            // given
            CreateDiaryDTO dto = new CreateDiaryDTO();
            dto.setTitle("수정된 제목");
            dto.setContent("수정된 내용");
            dto.setEmotion("sad");

            given(diaryRepository.findById(1L)).willReturn(Optional.of(testDiary));

            // when
            DiaryResponseDTO result = diaryService.updateDiary(1L, dto, 1L);

            // then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패: 다른 사용자의 일기 수정 시도")
        void updateDiary_accessDenied() {
            // given
            CreateDiaryDTO dto = new CreateDiaryDTO();
            given(diaryRepository.findById(1L)).willReturn(Optional.of(testDiary));

            // when & then
            assertThatThrownBy(() -> diaryService.updateDiary(1L, dto, 999L))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("본인의 일기만 수정");
        }
    }

    @Nested
    @DisplayName("일기 삭제 테스트")
    class DeleteDiaryTest {

        @Test
        @DisplayName("성공: 본인의 일기를 삭제한다")
        void deleteDiary_success() {
            // given
            given(diaryRepository.findById(1L)).willReturn(Optional.of(testDiary));

            // when
            diaryService.deleteDiary(1L, 1L);

            // then
            verify(diaryRepository).deleteById(1L);
        }

        @Test
        @DisplayName("실패: 다른 사용자의 일기 삭제 시도")
        void deleteDiary_accessDenied() {
            // given
            given(diaryRepository.findById(1L)).willReturn(Optional.of(testDiary));

            // when & then
            assertThatThrownBy(() -> diaryService.deleteDiary(1L, 999L))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("본인의 일기만 삭제");
        }
    }
}
