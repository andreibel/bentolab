package io.bento.orgservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class OrgNotFoundException extends RuntimeException {
    public OrgNotFoundException(String message) {
        super(message);
    }
}
