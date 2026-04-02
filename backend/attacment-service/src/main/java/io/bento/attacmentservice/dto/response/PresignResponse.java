package io.bento.attacmentservice.dto.response;

public record PresignResponse(
        String attachmentId,
        String uploadUrl,
        int expiresInMinutes
) {}
