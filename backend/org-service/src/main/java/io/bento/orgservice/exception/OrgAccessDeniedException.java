package io.bento.orgservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class OrgAccessDeniedException extends RuntimeException {
    public OrgAccessDeniedException(String message) {
        super(message);
    }
}
