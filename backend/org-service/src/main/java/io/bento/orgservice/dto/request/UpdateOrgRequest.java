package io.bento.orgservice.dto.request;

import io.bento.orgservice.entity.Organization;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Organization}
 */
public record UpdateOrgRequest(@Size(message = "Organization name cannot be bigger then 200", max = 200) String name,
                               @Size(message = "Organization domain cannot be bigger then 200", max = 200) String domain,
                               @Size(message = "Organization logo url cannot be bigger then 500", max = 500) String logoUrl,
                               String description) {
}