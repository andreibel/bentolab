package io.bento.taskservice.dto.request;

// assigneeId null means unassign
public record AssignIssueRequest(String assigneeId) {}
