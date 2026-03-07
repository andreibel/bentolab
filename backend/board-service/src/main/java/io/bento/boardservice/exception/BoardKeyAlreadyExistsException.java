package io.bento.boardservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class BoardKeyAlreadyExistsException extends RuntimeException {
    public BoardKeyAlreadyExistsException(String message) {
        super(message);
    }
}
