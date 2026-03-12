package io.bento.boardservice.entity;

import io.bento.boardservice.enums.BoardPermissionKey;
import io.bento.boardservice.enums.BoardRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Stores which BoardRoles are granted a given permission for a board.
 * One row per (boardId, permissionKey) pair. Initialized with defaults on board creation.
 */
@Entity
@Table(
    name = "board_permissions",
    uniqueConstraints = @UniqueConstraint(
        name = "uc_board_permissions_board_key",
        columnNames = {"board_id", "permission_key"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "board_id", nullable = false)
    private UUID boardId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_key", nullable = false, length = 100)
    private BoardPermissionKey permissionKey;

    /**
     * Comma-separated list of BoardRole enum names that have this permission.
     * Example: "DEVELOPER,SCRUM_MASTER,PRODUCT_OWNER"
     */
    @Column(name = "allowed_roles", nullable = false, length = 500)
    private String allowedRoles;

    // ── Helpers ───────────────────────────────────────────────────────────────

    public Set<BoardRole> getAllowedRolesSet() {
        if (allowedRoles == null || allowedRoles.isBlank()) return Set.of();
        return Arrays.stream(allowedRoles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(BoardRole::valueOf)
                .collect(Collectors.toSet());
    }

    public void setAllowedRolesSet(Set<BoardRole> roles) {
        this.allowedRoles = roles.stream()
                .map(Enum::name)
                .sorted()
                .collect(Collectors.joining(","));
    }

    public boolean hasRole(BoardRole role) {
        return getAllowedRolesSet().contains(role);
    }
}