package io.bento.taskservice.dto.response;

import java.time.Instant;

public record TimeLogResponse(
        String id,
        String issueId,
        String userId,
        Double hoursSpent,
        Instant date,
        String description,
        Instant createdAt
) {}
