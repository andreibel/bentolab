package io.bento.taskservice.exception;

public class IssueRelationNotFoundException extends ResourceNotFoundException {
    public IssueRelationNotFoundException(String relationId) {
        super("Issue relation not found: " + relationId);
    }
}
