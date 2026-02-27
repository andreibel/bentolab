package io.bento.orgservice.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TransferOrgOwnershipRequest(
        @NotNull(message = "New owner id cannot be null") UUID newOwnerId
) {
}
