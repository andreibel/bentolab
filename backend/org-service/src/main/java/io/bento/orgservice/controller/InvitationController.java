package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import io.bento.orgservice.service.OrgInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class InvitationController {

    private final OrgInvitationService orgInvitationService;

    @PostMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<InvitationResponse> sentInvitation(
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @Valid @RequestBody SendInvitationRequest invitationRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orgInvitationService.sentNewInvitation(adminId, orgId, orgRole, invitationRequest));
    }

    @GetMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<List<InvitationResponse>> getInvitations(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @RequestParam(required = false) Status status
    ) {
        return ResponseEntity.ok(orgInvitationService.getAllOrgActiveInitiation(orgId, orgRole, status));
    }

    @DeleteMapping("/orgs/{orgId}/invitations/{invitationId}")
    public ResponseEntity<Void> deleteInvitation(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @PathVariable("invitationId") UUID invitationId
    ) {
        orgInvitationService.deleteInvitation(orgId, orgRole, invitationId);
        return ResponseEntity.noContent().build();
    }

    // Public endpoint — token from invitation email, no org JWT context
    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<MemberResponse> acceptInvitation(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-Email") String email,
            @PathVariable("token") String tokenInvitation) {
        return ResponseEntity.ok(orgInvitationService.acceptNewMember(userId, email, tokenInvitation));
    }
}
