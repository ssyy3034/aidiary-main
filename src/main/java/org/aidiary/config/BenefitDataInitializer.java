package org.aidiary.config;

import org.aidiary.entity.Benefit;
import org.aidiary.repository.BenefitRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
public class BenefitDataInitializer {

    @Bean
    @Transactional
    public CommandLineRunner initBenefits(BenefitRepository benefitRepository) {
        return args -> {
            if (benefitRepository.count() == 0) {
                benefitRepository.saveAll(List.of(
                        Benefit.builder()
                                .title("임신·출산 진료비 지원 (국민행복카드)")
                                .description("병원 진료 및 약국 등에서 사용할 수 있는 바우처 발급! (단태아 100만 원, 다태아 140만 원)")
                                .recommendedWeekStart(1)
                                .recommendedWeekEnd(42)
                                .rewardAmount("100만 원")
                                .build(),
                        Benefit.builder()
                                .title("엽산제 지원")
                                .description("태아 신경관 결손 예방을 위해 보건소에서 무료 엽산제를 제공합니다.")
                                .recommendedWeekStart(1)
                                .recommendedWeekEnd(12)
                                .rewardAmount("무료 제공")
                                .build(),
                        Benefit.builder()
                                .title("철분제 지원")
                                .description("임산부의 빈혈 예방을 위해 보건소에서 무료 철분제를 제공합니다. 보건소별 지급 기준을 확인하세요.")
                                .recommendedWeekStart(16)
                                .recommendedWeekEnd(42)
                                .rewardAmount("무료 제공")
                                .build(),
                        Benefit.builder()
                                .title("임산부 친환경 농산물 꾸러미")
                                .description("지자체별로 임산부에게 친환경 농산물을 저렴하게 구매할 수 있도록 지원합니다. 조기 마감될 수 있으니 빨리 신청하세요!")
                                .recommendedWeekStart(1)
                                .recommendedWeekEnd(42)
                                .rewardAmount("연 48만")
                                .build(),
                        Benefit.builder()
                                .title("첫만남이용권 신청 준비")
                                .description("출생아 1인당 200만 원! 온라인 복지로 혹은 행정복지센터에서 신청해야 하므로, 출산을 앞두고 준비해 두면 좋아요.")
                                .recommendedWeekStart(32)
                                .recommendedWeekEnd(42)
                                .rewardAmount("200만 원")
                                .build()
                ));
            }
        };
    }
}
