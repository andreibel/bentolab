package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UpdateCommentRequest(

        @NotBlank(message = "Comment text is required")
        String text,

        List<String> mentionedUserIds
) {}
