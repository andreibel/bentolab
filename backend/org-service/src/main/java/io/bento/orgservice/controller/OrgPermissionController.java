package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.UpdateOrgPermissionRequest;
import io.bento.orgservice.dto.response.OrgPermissionResponse;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.service.OrgPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orgs/{orgId}/permissions")
public class OrgPermissionController {

    private final OrgPermissionService orgPermissionService;

    @GetMapping
    public ResponseEntity<List<OrgPermissionResponse>> getPermissions(
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(orgPermissionService.getPermissions(orgId));
    }

    @PutMapping("/{key}")
    public ResponseEntity<OrgPermissionResponse> updatePermission(
            @RequestHeader("X-Org-Role") OrgRoles orgRole,
            @PathVariable UUID orgId,
            @PathVariable String key,
            @Valid @RequestBody UpdateOrgPermissionRequest request) {
        return ResponseEntity.ok(orgPermissionService.updatePermission(orgId, key, request, orgRole));
    }
}
