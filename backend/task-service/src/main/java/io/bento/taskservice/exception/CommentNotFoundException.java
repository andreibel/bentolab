package io.bento.taskservice.exception;

public class CommentNotFoundException extends ResourceNotFoundException {
    public CommentNotFoundException(String commentId) {
        super("Comment not found: " + commentId);
    }
}
