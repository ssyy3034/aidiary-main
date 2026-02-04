package org.aidiary.exception;

import org.springframework.http.HttpStatus;

/**
 * 잘못된 비밀번호 입력 시 발생하는 예외
 */
public class InvalidPasswordException extends BusinessException {

    public InvalidPasswordException() {
        super("비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD");
    }
}
