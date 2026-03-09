package io.bento.taskservice.exception;

public class SprintNotFoundException extends ResourceNotFoundException {
    public SprintNotFoundException(String sprintId) {
        super("Sprint not found: " + sprintId);
    }
}
