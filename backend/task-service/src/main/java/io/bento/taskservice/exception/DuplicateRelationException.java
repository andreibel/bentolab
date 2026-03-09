package io.bento.taskservice.exception;

public class DuplicateRelationException extends RuntimeException {
    public DuplicateRelationException() {
        super("This relation already exists between the two issues");
    }
}
