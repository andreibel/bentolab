package io.bento.orgservice.entity;

import io.bento.orgservice.enums.OrgPermissionKey;
import io.bento.orgservice.enums.OrgRoles;
import jakarta.persistence.*;
import lombok.*;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Stores which OrgRoles are granted a given permission for an organization.
 * One row per (orgId, permissionKey) pair. Initialized with defaults on org creation.
 */
@Entity
@Table(
    name = "org_permissions",
    uniqueConstraints = @UniqueConstraint(
        name = "uc_org_permissions_org_key",
        columnNames = {"org_id", "permission_key"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_key", nullable = false, length = 100)
    private OrgPermissionKey permissionKey;

    /**
     * Comma-separated list of OrgRoles enum names that have this permission.
     * Example: "ORG_MEMBER,ORG_ADMIN,ORG_OWNER"
     */
    @Column(name = "allowed_roles", nullable = false, length = 500)
    private String allowedRoles;

    // ── Helpers ───────────────────────────────────────────────────────────────

    public Set<OrgRoles> getAllowedRolesSet() {
        if (allowedRoles == null || allowedRoles.isBlank()) return Set.of();
        return Arrays.stream(allowedRoles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(OrgRoles::valueOf)
                .collect(Collectors.toSet());
    }

    public void setAllowedRolesSet(Set<OrgRoles> roles) {
        this.allowedRoles = roles.stream()
                .map(Enum::name)
                .sorted()
                .collect(Collectors.joining(","));
    }

    public boolean hasRole(OrgRoles role) {
        return getAllowedRolesSet().contains(role);
    }
}