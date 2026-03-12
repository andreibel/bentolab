package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.UpdateOrgPermissionRequest;
import io.bento.orgservice.dto.response.OrgPermissionResponse;
import io.bento.orgservice.entity.OrgPermission;
import io.bento.orgservice.enums.OrgPermissionKey;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.repository.OrgPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrgPermissionService {

    private final OrgPermissionRepository orgPermissionRepository;

    /**
     * Initializes all permission rows with defaults when an org is created.
     * Safe to call multiple times — skips if already initialized.
     */
    @Transactional
    public void initializeDefaults(UUID orgId) {
        if (orgPermissionRepository.existsByOrgId(orgId)) return;

        List<OrgPermission> defaults = Arrays.stream(OrgPermissionKey.values())
                .map(key -> {
                    OrgPermission p = OrgPermission.builder()
                            .orgId(orgId)
                            .permissionKey(key)
                            .build();
                    p.setAllowedRolesSet(defaultRolesFor(key));
                    return p;
                })
                .collect(Collectors.toList());

        orgPermissionRepository.saveAll(defaults);
    }

    public List<OrgPermissionResponse> getPermissions(UUID orgId) {
        List<OrgPermission> permissions = orgPermissionRepository.findAllByOrgId(orgId);

        // If for some reason permissions were never initialized, return defaults without persisting
        if (permissions.isEmpty()) {
            return Arrays.stream(OrgPermissionKey.values())
                    .map(key -> toResponse(key, defaultRolesFor(key)))
                    .toList();
        }

        return permissions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public OrgPermissionResponse updatePermission(UUID orgId, String keyName, UpdateOrgPermissionRequest request, OrgRoles callerRole) {
        if (callerRole != OrgRoles.ORG_OWNER) {
            throw new OrgAccessDeniedException("Only the organization owner can change permission settings");
        }

        OrgPermissionKey key;
        try {
            key = OrgPermissionKey.valueOf(keyName);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown permission key: " + keyName);
        }

        if (key.isLocked()) {
            throw new OrgAccessDeniedException("Permission '" + key.getLabel() + "' is locked and cannot be changed");
        }

        // Validate that all provided roles are valid OrgRoles
        Set<OrgRoles> roles = request.allowedRoles().stream()
                .map(r -> {
                    try { return OrgRoles.valueOf(r); }
                    catch (IllegalArgumentException e) { throw new IllegalArgumentException("Unknown role: " + r); }
                })
                .collect(Collectors.toSet());

        OrgPermission permission = orgPermissionRepository.findByOrgIdAndPermissionKey(orgId, key)
                .orElseGet(() -> OrgPermission.builder().orgId(orgId).permissionKey(key).build());

        permission.setAllowedRolesSet(roles);
        orgPermissionRepository.save(permission);

        return toResponse(permission);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Set<OrgRoles> defaultRolesFor(OrgPermissionKey key) {
        return switch (key) {
            case ADMINISTER_ORG      -> Set.of(OrgRoles.ORG_OWNER);
            case MANAGE_MEMBERS      -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case MANAGE_INVITATIONS  -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case MANAGE_BOARDS       -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case MANAGE_ORG_SETTINGS -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case VIEW_ALL_BOARDS     -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case MANAGE_LABELS       -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
            case VIEW_MEMBERS        -> Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN, OrgRoles.ORG_MEMBER);
        };
    }

    private OrgPermissionResponse toResponse(OrgPermission p) {
        OrgPermissionKey key = p.getPermissionKey();
        return new OrgPermissionResponse(
                key.name(),
                key.getLabel(),
                key.getDescription(),
                key.isLocked(),
                p.getAllowedRolesSet().stream().map(Enum::name).collect(Collectors.toSet())
        );
    }

    private OrgPermissionResponse toResponse(OrgPermissionKey key, Set<OrgRoles> roles) {
        return new OrgPermissionResponse(
                key.name(),
                key.getLabel(),
                key.getDescription(),
                key.isLocked(),
                roles.stream().map(Enum::name).collect(Collectors.toSet())
        );
    }
}