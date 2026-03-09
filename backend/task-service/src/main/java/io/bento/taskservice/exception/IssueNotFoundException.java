package io.bento.taskservice.exception;

public class IssueNotFoundException extends ResourceNotFoundException {
    public IssueNotFoundException(String issueId) {
        super("Issue not found: " + issueId);
    }
}
