package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.response.PregnancyWeekDTO;
import org.aidiary.entity.Child;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.ChildRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PregnancyWeekService {

    private final UserRepository userRepository;
    private final ChildRepository childRepository;

    private static final Map<Integer, PregnancyWeekDTO> WEEK_DATA = new HashMap<>();

    static {
        WEEK_DATA.put(1, PregnancyWeekDTO.builder().week(1)
                .babySize("양귀비씨").babySizeCm("0.1cm").babyWeightG("1g 미만")
                .development("수정란이 자궁에 착상 준비 중입니다.")
                .maternalChanges("아직 임신 증상이 없을 수 있습니다.")
                .tip("엽산을 매일 400mcg 복용하세요.").build());
        WEEK_DATA.put(2, PregnancyWeekDTO.builder().week(2)
                .babySize("참깨").babySizeCm("0.1cm").babyWeightG("1g 미만")
                .development("배란이 일어나고 수정이 시작됩니다.")
                .maternalChanges("기초체온이 약간 상승할 수 있습니다.")
                .tip("균형 잡힌 식사와 충분한 수면이 중요합니다.").build());
        WEEK_DATA.put(3, PregnancyWeekDTO.builder().week(3)
                .babySize("겨자씨").babySizeCm("0.1cm").babyWeightG("1g 미만")
                .development("수정란이 자궁벽에 착상합니다. 세포 분열이 활발합니다.")
                .maternalChanges("착상 출혈이 있을 수 있습니다.")
                .tip("음주와 흡연을 삼가고 처방약도 의사와 상담하세요.").build());
        WEEK_DATA.put(4, PregnancyWeekDTO.builder().week(4)
                .babySize("양귀비 꽃봉오리").babySizeCm("0.2cm").babyWeightG("1g 미만")
                .development("신경관이 형성되기 시작합니다. 심장, 뇌, 척추의 기초가 잡힙니다.")
                .maternalChanges("생리가 없고 임신 테스트에서 양성이 나옵니다.")
                .tip("엽산 복용을 꼭 유지하세요. 신경관 결손 예방에 중요합니다.").build());
        WEEK_DATA.put(5, PregnancyWeekDTO.builder().week(5)
                .babySize("참깨").babySizeCm("0.4cm").babyWeightG("1g 미만")
                .development("심장이 뛰기 시작합니다. 팔다리의 싹이 생겨납니다.")
                .maternalChanges("입덧, 피로감, 유방 압통이 시작될 수 있습니다.")
                .tip("소량씩 자주 식사하면 입덧 완화에 도움이 됩니다.").build());
        WEEK_DATA.put(6, PregnancyWeekDTO.builder().week(6)
                .babySize("완두콩").babySizeCm("0.6cm").babyWeightG("1g 미만")
                .development("뇌와 척수가 발달합니다. 눈과 귀의 기초가 형성됩니다.")
                .maternalChanges("입덧이 심해질 수 있습니다. 잦은 소변이 시작됩니다.")
                .tip("비타민 B6가 입덧 완화에 효과적입니다. 의사와 상담하세요.").build());
        WEEK_DATA.put(7, PregnancyWeekDTO.builder().week(7)
                .babySize("블루베리").babySizeCm("1.3cm").babyWeightG("1g")
                .development("얼굴 윤곽이 잡히기 시작합니다. 손가락이 생겨납니다.")
                .maternalChanges("자궁이 점점 커집니다. 피로감이 심할 수 있습니다.")
                .tip("충분한 휴식을 취하고 낮잠도 활용하세요.").build());
        WEEK_DATA.put(8, PregnancyWeekDTO.builder().week(8)
                .babySize("라즈베리").babySizeCm("1.6cm").babyWeightG("1g")
                .development("손가락과 발가락이 뚜렷해집니다. 모든 주요 기관이 형성 중입니다.")
                .maternalChanges("가슴이 커지고 유두가 민감해집니다.")
                .tip("첫 산전 검사를 받을 시기입니다. 산부인과를 방문하세요.").build());
        WEEK_DATA.put(9, PregnancyWeekDTO.builder().week(9)
                .babySize("체리").babySizeCm("2.3cm").babyWeightG("2g")
                .development("태아의 움직임이 시작됩니다. 생식기가 발달하기 시작합니다.")
                .maternalChanges("입덧이 가장 심한 시기일 수 있습니다.")
                .tip("수분을 충분히 섭취하고 냄새가 강한 음식을 피하세요.").build());
        WEEK_DATA.put(10, PregnancyWeekDTO.builder().week(10)
                .babySize("딸기").babySizeCm("3.1cm").babyWeightG("4g")
                .development("모든 중요한 기관 형성이 완료됩니다. 태아기에 접어듭니다.")
                .maternalChanges("아랫배가 조금씩 나오기 시작합니다.")
                .tip("NT 검사(목 투명대 검사)를 11~13주 사이에 받으세요.").build());
        WEEK_DATA.put(11, PregnancyWeekDTO.builder().week(11)
                .babySize("무화과").babySizeCm("4.1cm").babyWeightG("7g")
                .development("손톱이 자라기 시작합니다. 얼굴이 점점 인간의 모습을 갖춥니다.")
                .maternalChanges("입덧이 서서히 줄어들 수 있습니다.")
                .tip("규칙적인 가벼운 운동이 도움이 됩니다. 걷기를 시작하세요.").build());
        WEEK_DATA.put(12, PregnancyWeekDTO.builder().week(12)
                .babySize("라임").babySizeCm("5.4cm").babyWeightG("14g")
                .development("성별이 구별되기 시작합니다. 신장이 기능하기 시작합니다.")
                .maternalChanges("초기 증상들이 완화되기 시작합니다.")
                .tip("1차 기형아 검사를 받을 시기입니다.").build());
        WEEK_DATA.put(13, PregnancyWeekDTO.builder().week(13)
                .babySize("복숭아").babySizeCm("7.4cm").babyWeightG("23g")
                .development("성대가 형성됩니다. 태아가 반사 운동을 합니다.")
                .maternalChanges("임신 2기에 접어들며 입덧이 대부분 사라집니다.")
                .tip("안정기에 접어들었습니다. 조심스럽게 활동을 늘려도 됩니다.").build());
        WEEK_DATA.put(14, PregnancyWeekDTO.builder().week(14)
                .babySize("레몬").babySizeCm("8.7cm").babyWeightG("43g")
                .development("표정 근육이 발달합니다. 엄지를 빨기도 합니다.")
                .maternalChanges("에너지가 회복되고 기분이 좋아집니다.")
                .tip("피부 보습에 신경 쓰세요. 튼살 예방 크림을 시작하세요.").build());
        WEEK_DATA.put(15, PregnancyWeekDTO.builder().week(15)
                .babySize("사과").babySizeCm("10.1cm").babyWeightG("70g")
                .development("태아가 소리에 반응하기 시작합니다. 배냇솜털이 자랍니다.")
                .maternalChanges("태동을 처음 느낄 수도 있습니다.")
                .tip("태아에게 말을 걸거나 음악을 들려주세요.").build());
        WEEK_DATA.put(16, PregnancyWeekDTO.builder().week(16)
                .babySize("아보카도").babySizeCm("11.6cm").babyWeightG("100g")
                .development("눈이 앞쪽을 향합니다. 다리가 팔보다 길어집니다.")
                .maternalChanges("배가 뚜렷이 나오기 시작합니다.")
                .tip("쿼드 검사(AFP 검사)를 15~20주 사이에 받으세요.").build());
        WEEK_DATA.put(17, PregnancyWeekDTO.builder().week(17)
                .babySize("무").babySizeCm("13.0cm").babyWeightG("140g")
                .development("지방이 축적되기 시작합니다. 땀샘이 발달합니다.")
                .maternalChanges("등통증이 시작될 수 있습니다.")
                .tip("임산부 베개를 사용해 편안한 수면 자세를 유지하세요.").build());
        WEEK_DATA.put(18, PregnancyWeekDTO.builder().week(18)
                .babySize("고구마").babySizeCm("14.2cm").babyWeightG("190g")
                .development("청각이 발달합니다. 외부 소리를 들을 수 있습니다.")
                .maternalChanges("태동을 확실히 느끼는 경우가 많습니다.")
                .tip("정기적으로 태동을 기록해 보세요.").build());
        WEEK_DATA.put(19, PregnancyWeekDTO.builder().week(19)
                .babySize("망고").babySizeCm("15.3cm").babyWeightG("240g")
                .development("감각 발달(시각, 청각, 후각, 미각, 촉각)이 활발합니다.")
                .maternalChanges("배꼽이 나오기 시작합니다.")
                .tip("철분제 복용을 시작하거나 철분이 풍부한 음식을 드세요.").build());
        WEEK_DATA.put(20, PregnancyWeekDTO.builder().week(20)
                .babySize("바나나").babySizeCm("16.4cm").babyWeightG("300g")
                .development("태아가 삼키고 소화하는 연습을 합니다.")
                .maternalChanges("임신 절반이 지났습니다!")
                .tip("정밀 초음파(20주 정밀 검사)를 받을 시기입니다.").build());
        WEEK_DATA.put(21, PregnancyWeekDTO.builder().week(21)
                .babySize("당근").babySizeCm("26.7cm").babyWeightG("360g")
                .development("눈썹과 속눈썹이 발달합니다. 소화 효소가 생산됩니다.")
                .maternalChanges("역류성 식도염이 생길 수 있습니다.")
                .tip("소량씩 자주 먹고 식후 바로 눕지 마세요.").build());
        WEEK_DATA.put(22, PregnancyWeekDTO.builder().week(22)
                .babySize("파파야").babySizeCm("27.8cm").babyWeightG("430g")
                .development("손잡이가 발달합니다. 양수를 마시고 내뱉습니다.")
                .maternalChanges("발목이 붓기 시작할 수 있습니다.")
                .tip("다리를 높이 올려 쉬고 소금 섭취를 줄이세요.").build());
        WEEK_DATA.put(23, PregnancyWeekDTO.builder().week(23)
                .babySize("생망고").babySizeCm("28.9cm").babyWeightG("501g")
                .development("폐가 발달합니다. 생존 가능성이 생기는 시기입니다.")
                .maternalChanges("튼살이 생길 수 있습니다.")
                .tip("튼살 크림을 꾸준히 바르고 급격한 체중 증가를 피하세요.").build());
        WEEK_DATA.put(24, PregnancyWeekDTO.builder().week(24)
                .babySize("옥수수").babySizeCm("30.0cm").babyWeightG("600g")
                .development("뇌가 빠르게 발달합니다. 폐에서 계면활성제가 생산됩니다.")
                .maternalChanges("임신성 당뇨 검사 시기입니다.")
                .tip("임신성 당뇨 선별검사(당부하검사)를 받으세요.").build());
        WEEK_DATA.put(25, PregnancyWeekDTO.builder().week(25)
                .babySize("순무").babySizeCm("34.6cm").babyWeightG("660g")
                .development("모발이 자라기 시작합니다. 성별이 초음파로 확인 가능합니다.")
                .maternalChanges("골반 통증이 생길 수 있습니다.")
                .tip("임산부 수영이나 요가가 통증 완화에 도움이 됩니다.").build());
        WEEK_DATA.put(26, PregnancyWeekDTO.builder().week(26)
                .babySize("케일").babySizeCm("35.6cm").babyWeightG("760g")
                .development("눈이 열리기 시작합니다. 규칙적인 호흡 운동을 합니다.")
                .maternalChanges("수면이 불편해지기 시작합니다.")
                .tip("왼쪽으로 누워 자면 혈액 순환에 좋습니다.").build());
        WEEK_DATA.put(27, PregnancyWeekDTO.builder().week(27)
                .babySize("상추 한 포기").babySizeCm("36.6cm").babyWeightG("875g")
                .development("뇌가 활발하게 발달합니다. 태아가 꿈을 꿀 수도 있습니다.")
                .maternalChanges("임신 3기에 접어듭니다.")
                .tip("출산 준비 교실이나 라마즈 교실 등록을 고려하세요.").build());
        WEEK_DATA.put(28, PregnancyWeekDTO.builder().week(28)
                .babySize("가지").babySizeCm("37.6cm").babyWeightG("1005g")
                .development("눈꺼풀이 열리고 닫힙니다. 뇌 활동이 활발해집니다.")
                .maternalChanges("숨이 차고 등이 아플 수 있습니다.")
                .tip("태동 횟수를 매일 기록하세요. 2시간 내 10회 이상이 정상입니다.").build());
        WEEK_DATA.put(29, PregnancyWeekDTO.builder().week(29)
                .babySize("호박").babySizeCm("38.6cm").babyWeightG("1153g")
                .development("뼈가 단단해지고 근육이 발달합니다.")
                .maternalChanges("빈혈이 생길 수 있습니다.")
                .tip("철분이 풍부한 식품(시금치, 쇠고기, 콩류)을 챙겨 드세요.").build());
        WEEK_DATA.put(30, PregnancyWeekDTO.builder().week(30)
                .babySize("양배추").babySizeCm("39.9cm").babyWeightG("1319g")
                .development("양수가 최고조에 달합니다. 손가락으로 물건을 잡습니다.")
                .maternalChanges("배가 많이 나와 자세 유지가 어렵습니다.")
                .tip("출산 가방을 미리 준비하기 시작하세요.").build());
        WEEK_DATA.put(31, PregnancyWeekDTO.builder().week(31)
                .babySize("코코넛").babySizeCm("41.1cm").babyWeightG("1502g")
                .development("면역 체계가 발달합니다. 양수 속에서 활발하게 움직입니다.")
                .maternalChanges("잦은 소변과 불면증이 심해집니다.")
                .tip("수분 섭취는 줄이지 말고, 자기 전 방광을 비워두세요.").build());
        WEEK_DATA.put(32, PregnancyWeekDTO.builder().week(32)
                .babySize("잭프루트 작은 것").babySizeCm("42.4cm").babyWeightG("1702g")
                .development("피부가 덜 쭈글쭈글해집니다. 폐가 성숙해집니다.")
                .maternalChanges("가진통(브랙스턴 힉스 수축)이 느껴질 수 있습니다.")
                .tip("가진통과 진진통을 구별하는 방법을 익혀두세요.").build());
        WEEK_DATA.put(33, PregnancyWeekDTO.builder().week(33)
                .babySize("파인애플").babySizeCm("43.7cm").babyWeightG("1918g")
                .development("뼈가 더 단단해집니다. 두개골은 유연하게 유지됩니다.")
                .maternalChanges("숨이 많이 차고 명치가 더부룩합니다.")
                .tip("GBS(B군 연쇄상구균) 검사를 35~37주에 받습니다.").build());
        WEEK_DATA.put(34, PregnancyWeekDTO.builder().week(34)
                .babySize("멜론").babySizeCm("45.0cm").babyWeightG("2146g")
                .development("중추신경계가 성숙해집니다. 생존 능력이 높습니다.")
                .maternalChanges("태아가 머리를 아래로 내리는 경우가 많습니다.")
                .tip("병원 이동 방법, 진통 시 대처 방법을 미리 계획하세요.").build());
        WEEK_DATA.put(35, PregnancyWeekDTO.builder().week(35)
                .babySize("허니듀 멜론").babySizeCm("46.2cm").babyWeightG("2383g")
                .development("신장이 완전히 발달합니다. 간이 노폐물을 처리합니다.")
                .maternalChanges("골반 압박감이 심해집니다.")
                .tip("분만 계획서를 작성하고 의료진과 상의하세요.").build());
        WEEK_DATA.put(36, PregnancyWeekDTO.builder().week(36)
                .babySize("파파야 큰 것").babySizeCm("47.4cm").babyWeightG("2622g")
                .development("지방이 계속 축적됩니다. 손발톱이 손끝에 닿습니다.")
                .maternalChanges("태아가 내려가면서 숨쉬기가 편해질 수 있습니다.")
                .tip("입원 가방을 완전히 준비하세요.").build());
        WEEK_DATA.put(37, PregnancyWeekDTO.builder().week(37)
                .babySize("스위스 차드 한 묶음").babySizeCm("48.6cm").babyWeightG("2859g")
                .development("폐가 완전히 성숙합니다. 만삭(37주)에 접어들었습니다.")
                .maternalChanges("이슬이 비칠 수 있습니다.")
                .tip("진통 시 병원에 언제 가야 할지 의사에게 미리 확인하세요.").build());
        WEEK_DATA.put(38, PregnancyWeekDTO.builder().week(38)
                .babySize("부추 한 단").babySizeCm("49.8cm").babyWeightG("3083g")
                .development("모든 장기가 출생 후 기능을 위해 준비됩니다.")
                .maternalChanges("불규칙한 자궁 수축이 잦아집니다.")
                .tip("5-1-1 규칙: 수축이 5분마다, 1분씩 지속, 1시간 이상이면 병원에 가세요.").build());
        WEEK_DATA.put(39, PregnancyWeekDTO.builder().week(39)
                .babySize("수박 작은 것").babySizeCm("50.7cm").babyWeightG("3288g")
                .development("두뇌가 계속 발달합니다. 면역 항체를 받습니다.")
                .maternalChanges("언제든 출산할 수 있습니다.")
                .tip("양수가 터지면 즉시 병원으로 가세요.").build());
        WEEK_DATA.put(40, PregnancyWeekDTO.builder().week(40)
                .babySize("호박 큰 것").babySizeCm("51.2cm").babyWeightG("3462g")
                .development("태아가 출생 준비를 마쳤습니다!")
                .maternalChanges("출산 예정일입니다!")
                .tip("침착하게 진통을 지켜보고 병원의 지시에 따르세요.").build());
        WEEK_DATA.put(41, PregnancyWeekDTO.builder().week(41)
                .babySize("파인애플 큰 것").babySizeCm("51.7cm").babyWeightG("3597g")
                .development("태아가 계속 자랍니다.")
                .maternalChanges("과숙 임신 모니터링이 필요합니다.")
                .tip("의사와 유도 분만에 대해 상담하세요.").build());
        WEEK_DATA.put(42, PregnancyWeekDTO.builder().week(42)
                .babySize("수박").babySizeCm("51.7cm이상").babyWeightG("3685g이상")
                .development("태아가 완전히 성숙했습니다.")
                .maternalChanges("의료적 개입이 필요할 수 있습니다.")
                .tip("의사의 지시에 따라 유도 분만 또는 제왕절개를 고려하세요.").build());
    }

    public PregnancyWeekDTO getWeekData(int week) {
        if (week < 1 || week > 42) {
            throw new IllegalArgumentException("임신 주차는 1~42 사이여야 합니다.");
        }
        return WEEK_DATA.get(week);
    }

    public PregnancyWeekDTO getCurrentWeekData(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Child child = childRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Child", userId));

        String childBirthday = child.getChildBirthday();
        if (childBirthday == null || childBirthday.isBlank()) {
            return getWeekData(1);
        }

        LocalDate dueDate = LocalDate.parse(childBirthday);
        LocalDate today = LocalDate.now();
        LocalDate lmp = dueDate.minusDays(280); // 마지막 생리일 추정
        long daysSinceLmp = ChronoUnit.DAYS.between(lmp, today);
        int week = (int) (daysSinceLmp / 7) + 1;
        week = Math.max(1, Math.min(42, week));
        return getWeekData(week);
    }
}
