package org.aidiary.service;

import org.springframework.stereotype.Component;
import java.util.Optional;

/**
 * 이미지 인식 및 처리 중 발생하는 기술적 에러를 사용자 친화적인 메시지로 변환하는 컴포넌트.
 * 전략 패턴의 일환으로 에러 매핑 책임을 분리하여 컨트롤러의 비대화를 방지한다.
 */
@Component
public class ImageErrorMapper {

    private static final String DEFAULT_ERROR_MESSAGE = "이미지 분석 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

    public String mapToUserFriendlyMessage(String technicalError) {
        return Optional.ofNullable(technicalError)
                .map(this::resolveMessage)
                .orElse(DEFAULT_ERROR_MESSAGE);
    }

    private String resolveMessage(String error) {
        if (error.contains("No face detected")) {
            return "사진에서 얼굴을 찾을 수 없습니다. 정면이 잘 보이는 밝은 사진으로 다시 시도해 주세요.";
        }
        if (error.contains("Multiple faces detected")) {
            return "사진에 여러 명의 얼굴이 감지되었습니다. 한 명의 얼굴만 나온 사진을 사용해 주세요.";
        }
        if (error.contains("Image quality too low")) {
            return "사진의 화질이 너무 낮아 분석할 수 없습니다. 더 선명한 사진을 사용해 주세요.";
        }
        if (error.contains("Invalid image format")) {
            return "지원하지 않는 이미지 형식입니다. JPG나 PNG 파일을 사용해 주세요.";
        }
        
        return "서비스 일시적 오류: " + error;
    }
}
