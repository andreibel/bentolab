package io.bento.orgservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidInvitationStatusException extends RuntimeException {
    public InvalidInvitationStatusException(String message) {
        super(message);
    }
}
