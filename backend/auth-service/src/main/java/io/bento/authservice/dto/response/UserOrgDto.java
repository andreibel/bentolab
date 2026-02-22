package io.bento.authservice.dto.response;

import java.util.UUID;

public record UserOrgDto(
        UUID orgId,
        String orgName,
        String orgSlug,
        String orgRole,
        String logoUrl
) {}
