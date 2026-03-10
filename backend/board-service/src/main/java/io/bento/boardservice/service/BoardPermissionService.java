package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.UpdateBoardPermissionRequest;
import io.bento.boardservice.dto.response.BoardPermissionResponse;
import io.bento.boardservice.entity.BoardPermission;
import io.bento.boardservice.enums.BoardPermissionKey;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.repository.BoardPermissionRepository;
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
public class BoardPermissionService {

    private final BoardPermissionRepository boardPermissionRepository;

    /**
     * Initializes all permission rows with defaults when a board is created.
     * Safe to call multiple times — skips if already initialized.
     */
    @Transactional
    public void initializeDefaults(UUID boardId) {
        if (boardPermissionRepository.existsByBoardId(boardId)) return;

        List<BoardPermission> defaults = Arrays.stream(BoardPermissionKey.values())
                .map(key -> {
                    BoardPermission p = BoardPermission.builder()
                            .boardId(boardId)
                            .permissionKey(key)
                            .build();
                    p.setAllowedRolesSet(defaultRolesFor(key));
                    return p;
                })
                .collect(Collectors.toList());

        boardPermissionRepository.saveAll(defaults);
    }

    public List<BoardPermissionResponse> getPermissions(UUID boardId) {
        List<BoardPermission> permissions = boardPermissionRepository.findAllByBoardId(boardId);

        if (permissions.isEmpty()) {
            return Arrays.stream(BoardPermissionKey.values())
                    .map(key -> toResponse(key, defaultRolesFor(key)))
                    .toList();
        }

        return permissions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public BoardPermissionResponse updatePermission(UUID boardId, String keyName, UpdateBoardPermissionRequest request) {
        BoardPermissionKey key;
        try {
            key = BoardPermissionKey.valueOf(keyName);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown permission key: " + keyName);
        }

        if (key.isLocked()) {
            throw new BoardAccessDeniedException("Permission '" + key.getLabel() + "' is locked and cannot be changed");
        }

        Set<BoardRole> roles = request.allowedRoles().stream()
                .map(r -> {
                    try { return BoardRole.valueOf(r); }
                    catch (IllegalArgumentException e) { throw new IllegalArgumentException("Unknown role: " + r); }
                })
                .collect(Collectors.toSet());

        BoardPermission permission = boardPermissionRepository.findByBoardIdAndPermissionKey(boardId, key)
                .orElseGet(() -> BoardPermission.builder().boardId(boardId).permissionKey(key).build());

        permission.setAllowedRolesSet(roles);
        boardPermissionRepository.save(permission);

        return toResponse(permission);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Set<BoardRole> defaultRolesFor(BoardPermissionKey key) {
        return switch (key) {
            case ADMINISTER_BOARD    -> Set.of(BoardRole.PRODUCT_OWNER);
            case VIEW_BOARD          -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER, BoardRole.DEVELOPER, BoardRole.VIEWER);
            case CREATE_ISSUES       -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER, BoardRole.DEVELOPER);
            case EDIT_ISSUES         -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER, BoardRole.DEVELOPER);
            case DELETE_ISSUES       -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
            case MOVE_ISSUES         -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER, BoardRole.DEVELOPER);
            case MANAGE_SPRINTS      -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
            case MANAGE_COLUMNS      -> Set.of(BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
            case MANAGE_BOARD_MEMBERS -> Set.of(BoardRole.PRODUCT_OWNER);
            case MANAGE_BOARD_SETTINGS -> Set.of(BoardRole.PRODUCT_OWNER);
        };
    }

    private BoardPermissionResponse toResponse(BoardPermission p) {
        BoardPermissionKey key = p.getPermissionKey();
        return new BoardPermissionResponse(
                key.name(),
                key.getLabel(),
                key.getDescription(),
                key.isLocked(),
                p.getAllowedRolesSet().stream().map(Enum::name).collect(Collectors.toSet())
        );
    }

    private BoardPermissionResponse toResponse(BoardPermissionKey key, Set<BoardRole> roles) {
        return new BoardPermissionResponse(
                key.name(),
                key.getLabel(),
                key.getDescription(),
                key.isLocked(),
                roles.stream().map(Enum::name).collect(Collectors.toSet())
        );
    }
}