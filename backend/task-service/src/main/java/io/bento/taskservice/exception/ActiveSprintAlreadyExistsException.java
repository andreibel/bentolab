package io.bento.taskservice.exception;

public class ActiveSprintAlreadyExistsException extends RuntimeException {
    public ActiveSprintAlreadyExistsException(String boardId) {
        super("Board already has an active sprint: " + boardId);
    }
}
