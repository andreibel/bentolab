package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.entity.OrgInvitation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class OrgInvitationMapper {

    public InvitationResponse toInvitationResponse(OrgInvitation invitation) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getEmail(),
                invitation.getOrgRole(),
                invitation.getStatus(),
                invitation.getInvitedBy(),
                invitation.getExpiresAt(),
                invitation.getCreatedAt(),
                invitation.getToken()
        );
    }
}
