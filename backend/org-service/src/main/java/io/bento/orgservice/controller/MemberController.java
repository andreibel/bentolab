package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.UpdateMemberRoleRequest;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orgs/{orgId}/members")
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(memberService.getAllOrgMember(orgId));
    }

    @PatchMapping("{userId}/role")
    public ResponseEntity<MemberResponse> updateMembersRole(
            @RequestHeader("X-User-Id") UUID adminUserId,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID userId,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateMemberRoleRequest roleRequest) {
        return ResponseEntity.ok(memberService.updateMemberRole(adminUserId, userId, orgId, orgRole, roleRequest));
    }

    @DeleteMapping("{userId}")
    public ResponseEntity<Void> deleteMember(
            @RequestHeader("X-User-Id") UUID adminUserId,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID userId,
            @PathVariable UUID orgId
    ) {
        memberService.deleteMember(adminUserId, userId, orgId, orgRole);
        return ResponseEntity.noContent().build();
    }
}
