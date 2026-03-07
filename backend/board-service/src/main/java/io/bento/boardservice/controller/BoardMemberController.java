package io.bento.boardservice.controller;

import io.bento.boardservice.dto.request.AddBoardMemberRequest;
import io.bento.boardservice.dto.request.UpdateBoardMemberRoleRequest;
import io.bento.boardservice.dto.response.BoardMemberResponse;
import io.bento.boardservice.service.BoardMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/members")
@RequiredArgsConstructor
public class BoardMemberController {

    private final BoardMemberService boardMemberService;

    @GetMapping
    public ResponseEntity<List<BoardMemberResponse>> getMembers(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        return ResponseEntity.ok(boardMemberService.getMembers(userId, orgRole, boardId));
    }

    @PostMapping
    public ResponseEntity<BoardMemberResponse> addMember(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @Valid @RequestBody AddBoardMemberRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boardMemberService.addMember(userId, orgRole, boardId, request));
    }

    @PatchMapping("/{targetUserId}")
    public ResponseEntity<BoardMemberResponse> updateMemberRole(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID targetUserId,
            @Valid @RequestBody UpdateBoardMemberRoleRequest request
    ) {
        return ResponseEntity.ok(boardMemberService.updateMemberRole(userId, orgRole, boardId, targetUserId, request));
    }

    @DeleteMapping("/{targetUserId}")
    public ResponseEntity<Void> removeMember(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID targetUserId
    ) {
        boardMemberService.removeMember(userId, orgRole, boardId, targetUserId);
        return ResponseEntity.noContent().build();
    }
}
