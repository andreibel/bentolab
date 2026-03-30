package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.GenerateInviteLinkRequest;
import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.AcceptInvitationResponse;
import io.bento.orgservice.dto.response.InvitationPreviewResponse;
import io.bento.orgservice.dto.response.InvitationResponse;
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

    // ── Email-specific invitation ─────────────────────────────────────────────

    @PostMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<InvitationResponse> sendInvitation(
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @Valid @RequestBody SendInvitationRequest invitationRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orgInvitationService.sendEmailInvitation(adminId, orgId, orgRole, invitationRequest));
    }

    // ── Open invite link (no email restriction) ───────────────────────────────

    @PostMapping("/orgs/{orgId}/invite-link")
    public ResponseEntity<InvitationResponse> generateInviteLink(
            @RequestHeader("X-User-Id") UUID adminId,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @Valid @RequestBody GenerateInviteLinkRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orgInvitationService.generateOpenInviteLink(adminId, orgId, orgRole, request));
    }

    // ── List / revoke invitations ─────────────────────────────────────────────

    @GetMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<List<InvitationResponse>> getInvitations(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable("orgId") UUID orgId,
            @RequestParam(required = false) Status status
    ) {
        return ResponseEntity.ok(orgInvitationService.getAllOrgInvitations(orgId, orgRole, status));
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

    // ── Public endpoints (no JWT — see gateway public-paths config) ───────────

    /**
     * Preview an invitation before the user is logged in.
     * Returns org info so the UI can show a branded landing page.
     * Endpoint is listed in gateway public-paths as /
     */
    @GetMapping("/invitations/{token}/preview")
    public ResponseEntity<InvitationPreviewResponse> previewInvitation(
            @PathVariable("token") String token
    ) {
        return ResponseEntity.ok(orgInvitationService.getInvitationPreview(token));
    }

    /**
     * Accept an invitation — user must be authenticated (JWT required).
     * For email invites the user's email must match the invite's email.
     * For open link invites any authenticated user can accept.
     */
    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<AcceptInvitationResponse> acceptInvitation(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-Email") String email,
            @PathVariable("token") String token
    ) {
        return ResponseEntity.ok(orgInvitationService.acceptInvitation(userId, email, token));
    }
}