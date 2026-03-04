package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.service.OrgInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class InvitationController {

    private final OrgInvitationService orgInvitationService;

    @PostMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<InvitationResponse> sentInvitation(
            @RequestHeader("X-User-Id") UUID adminId,
            @PathVariable("orgId") UUID orgId,
            @Valid @RequestBody SendInvitationRequest invitationRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orgInvitationService.sentNewInvitation(adminId, orgId, invitationRequest));
    }
}

