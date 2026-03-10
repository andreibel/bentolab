package io.bento.boardservice.controller;

import io.bento.boardservice.dto.request.UpdateBoardPermissionRequest;
import io.bento.boardservice.dto.response.BoardPermissionResponse;
import io.bento.boardservice.service.BoardAccessService;
import io.bento.boardservice.service.BoardPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{boardId}/permissions")
public class BoardPermissionController {

    private final BoardPermissionService boardPermissionService;
    private final BoardAccessService boardAccessService;

    @GetMapping
    public ResponseEntity<List<BoardPermissionResponse>> getPermissions(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId) {
        boardAccessService.requireBoardMemberOrAdmin(userId, orgRole, boardId);
        return ResponseEntity.ok(boardPermissionService.getPermissions(boardId));
    }

    @PutMapping("/{key}")
    public ResponseEntity<BoardPermissionResponse> updatePermission(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable String key,
            @Valid @RequestBody UpdateBoardPermissionRequest request) {
        boardAccessService.requireBoardOwnerOrOrgOwner(userId, orgRole, boardId);
        return ResponseEntity.ok(boardPermissionService.updatePermission(boardId, key, request));
    }
}