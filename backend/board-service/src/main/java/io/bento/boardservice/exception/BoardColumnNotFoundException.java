package io.bento.boardservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class BoardColumnNotFoundException extends RuntimeException {
    public BoardColumnNotFoundException(String message) {
        super(message);
    }
}
