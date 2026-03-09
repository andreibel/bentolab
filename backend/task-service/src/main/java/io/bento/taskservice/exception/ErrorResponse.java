package io.bento.taskservice.exception;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(int status, String message, List<String> errors, Instant timestamp) {

    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, List.of(), Instant.now());
    }

    public static ErrorResponse of(int status, String message, List<String> errors) {
        return new ErrorResponse(status, message, errors, Instant.now());
    }
}
