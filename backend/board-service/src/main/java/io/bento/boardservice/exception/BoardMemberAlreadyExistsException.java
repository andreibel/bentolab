package io.bento.boardservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class BoardMemberAlreadyExistsException extends RuntimeException {
    public BoardMemberAlreadyExistsException(String message) {
        super(message);
    }
}
