package io.bento.orgservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class OrganizationMemberNotFoundException extends RuntimeException {
    public OrganizationMemberNotFoundException(String message) {
        super(message);
    }
}
