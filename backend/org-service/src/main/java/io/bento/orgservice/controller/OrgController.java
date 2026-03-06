package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.request.TransferOrgOwnershipRequest;
import io.bento.orgservice.dto.request.UpdateOrgRequest;
import io.bento.orgservice.dto.request.UpdateOrgSettingsRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.enums.OrgRoles;
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
            @PathVariable UUID orgId
    ) {
        return ResponseEntity.ok(orgService.getOrgById(orgId));
    }

    @PatchMapping("/{orgId}")
    public ResponseEntity<OrgResponse> updateOrganization(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateOrgRequest request) {
        return ResponseEntity.ok(orgService.updateOrg(orgId, orgRole, request));
    }

    @PatchMapping("/{orgId}/settings")
    public ResponseEntity<OrgResponse> updateOrganizationSettings(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateOrgSettingsRequest request) {
        return ResponseEntity.ok(orgService.updateOrgSettings(orgId, orgRole, request));
    }

    @PostMapping("/{orgId}/transfer")
    public ResponseEntity<Void> transferOrganizationOwnership(
            @RequestHeader("X-User-Id") UUID userid,
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID orgId,
            @Valid @RequestBody TransferOrgOwnershipRequest request) {
        orgService.transferOrgOwnership(userid, orgId, orgRole, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> deleteOrganization(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID orgId
    ) {
        orgService.deleteOrg(orgId, orgRole);
        return ResponseEntity.noContent().build();
    }
}
