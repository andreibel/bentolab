package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.request.TransferOrgOwnershipRequest;
import io.bento.orgservice.dto.request.UpdateOrgRequest;
import io.bento.orgservice.dto.request.UpdateOrgSettingsRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.service.OrgService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orgs")
@RequiredArgsConstructor
public class OrgController {


    private final OrgService orgService;

    @PostMapping
    public ResponseEntity<OrgResponse> createOrganization(
            @RequestHeader("X-User-Id") UUID userid,
            @Valid @RequestBody CreateOrgRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orgService.createOrg(userid, request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrgResponse>> getMyOrganizations(
            @RequestHeader("X-User-Id") UUID userid
    ) {
        return ResponseEntity.ok(orgService.getMyOrgs(userid));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrgResponse> getOrganizationById(
            @RequestHeader("X-User-Id") UUID userid,
            @PathVariable UUID orgId
    ) {
        return ResponseEntity.ok(orgService.getOrgById(userid, orgId));
    }

    @PatchMapping("/{orgId}")
    public ResponseEntity<OrgResponse> updateOrganization(
            @RequestHeader("X-User-Id") UUID userid,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateOrgRequest request) {
        return ResponseEntity.ok(orgService.updateOrg(userid, orgId, request));
    }

    @PatchMapping("/{orgId}/settings")
    public ResponseEntity<OrgResponse> updateOrganizationSettings(
            @RequestHeader("X-User-Id") UUID userid,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateOrgSettingsRequest request) {
        return ResponseEntity.ok(orgService.updateOrgSettings(userid, orgId, request));
    }



}

