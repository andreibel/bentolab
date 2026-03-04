package io.bento.orgservice.dto.request;

import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.enums.OrgRoles;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for {@link OrgInvitation}
 */
public record SendInvitationRequest(@Email(message = "Member need to me an Email") @NotBlank String email,
                                    @NotNull OrgRoles orgRole,
                                    String message) {
}