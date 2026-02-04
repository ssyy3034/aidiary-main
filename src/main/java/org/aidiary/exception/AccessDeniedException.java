package org.aidiary.exception;

import org.springframework.http.HttpStatus;

/**
 * 접근 권한이 없을 때 발생하는 예외
 */
public class AccessDeniedException extends BusinessException {

    public AccessDeniedException() {
        super("해당 리소스에 대한 접근 권한이 없습니다.", HttpStatus.FORBIDDEN, "ACCESS_DENIED");
    }

    public AccessDeniedException(String message) {
        super(message, HttpStatus.FORBIDDEN, "ACCESS_DENIED");
    }

    public AccessDeniedException(String resourceName, String action) {
        super(
                String.format("%s에 대한 %s 권한이 없습니다.", resourceName, action),
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED");
    }
}
