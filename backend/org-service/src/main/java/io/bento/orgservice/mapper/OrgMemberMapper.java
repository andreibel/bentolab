package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrganizationMember;
import org.springframework.stereotype.Component;

@Component
public class OrgMemberMapper {
    public MemberResponse toMemberResponse(OrganizationMember member) {
        return new MemberResponse(
                member.getUserId(),
                member.getOrgRole(),
                member.getInvitedBy(),
                member.getJoinedAt()
        );
    }

}
