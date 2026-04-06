package io.bento.taskservice.exception;

public class MilestoneNotFoundException extends ResourceNotFoundException {
    public MilestoneNotFoundException(String milestoneId) {
        super("Milestone not found: " + milestoneId);
    }
}