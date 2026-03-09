package io.bento.taskservice.dto.response;

import java.time.Instant;
import java.util.List;

public record CommentResponse(
        String id,
        String issueId,
        String userId,
        String text,
        List<String> mentionedUserIds,
        Boolean isEdited,
        Instant createdAt,
        Instant updatedAt
) {}
