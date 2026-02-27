package io.bento.orgservice.dto.request;

import jakarta.validation.constraints.Min;

public record UpdateOrgSettingsRequest(
        @Min(value = 1, message = "Organization cannot be less then one member") Integer maxUsers,
        @Min(value = 1, message = "Organization cannot be less then one Board") Integer maxBoards,
        @Min(value = 0, message = "Organization cannot be less then zero storge") Double maxStorageGB,
        Boolean allowDiscord,
        Boolean allowExport,
        Boolean customBranding,
        Boolean ssoEnabled
) {
}
