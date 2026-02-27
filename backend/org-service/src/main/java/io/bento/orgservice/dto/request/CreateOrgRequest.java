package io.bento.orgservice.dto.request;

import io.bento.orgservice.entity.Organization;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Organization}
 */
public record CreateOrgRequest(
        @Size(message = "Organization name cannot be bigger then 200", max = 200) @NotBlank(message = "Organization Name can't be empty") String name,
        @Size(message = "Organization slug cannot be bigger then 100", max = 100) @NotBlank(message = "Organization " + "Slug can't be empty") @Pattern(regexp = "^[a-z0-9-]+$", message = "slug not in the right matter only lower case letters , '-' and numbers. ") String slug,
        @Size(message = "Organization domain cannot be bigger then 200", max = 200) String domain,
        @Size(message = "Organization logo url cannot be bigger then 500", max = 500) String logoUrl,
        String description) {
}