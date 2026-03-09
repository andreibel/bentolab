package io.bento.taskservice.dto.response;

import io.bento.taskservice.enums.RelationType;

import java.time.Instant;

public record IssueRelationResponse(
        String id,
        String sourceIssueId,
        String targetIssueId,
        RelationType relationType,
        String createdBy,
        Instant createdAt
) {}
