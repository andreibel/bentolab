package io.bento.taskservice.exception;

public class EpicNotFoundException extends ResourceNotFoundException {
    public EpicNotFoundException(String epicId) {
        super("Epic not found: " + epicId);
    }
}