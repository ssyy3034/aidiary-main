package org.aidiary.exception;

import org.springframework.http.HttpStatus;

/**
 * 중복 데이터가 있을 때 발생하는 예외
 */
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String resourceName, String fieldName) {
        super(
                String.format("이미 존재하는 %s입니다. (%s)", resourceName, fieldName),
                HttpStatus.CONFLICT,
                "DUPLICATE_RESOURCE");
    }
}
