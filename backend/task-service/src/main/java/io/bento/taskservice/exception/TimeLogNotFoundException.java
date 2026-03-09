package io.bento.taskservice.exception;

public class TimeLogNotFoundException extends ResourceNotFoundException {
    public TimeLogNotFoundException(String timeLogId) {
        super("Time log not found: " + timeLogId);
    }
}
