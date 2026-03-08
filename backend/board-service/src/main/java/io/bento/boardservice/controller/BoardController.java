package io.bento.boardservice.controller;

import io.bento.boardservice.dto.request.CreateBoardRequest;
import io.bento.boardservice.dto.request.UpdateBoardRequest;
import io.bento.boardservice.dto.response.BoardResponse;
import io.bento.boardservice.dto.response.BoardSummaryResponse;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<List<BoardSummaryResponse>> getBoards(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Id") UUID orgId,
            @RequestHeader("X-Org-Role") String orgRole
    ) {
        return ResponseEntity.ok(boardService.getBoards(userId, orgId, orgRole));
    }

    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Id") UUID orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody CreateBoardRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boardService.createBoard(userId, orgId, orgRole, request));
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<BoardResponse> getBoard(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        return ResponseEntity.ok(boardService.getBoard(userId, orgRole, boardId));
    }

    @PatchMapping("/{boardId}")
    public ResponseEntity<BoardResponse> updateBoard(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @Valid @RequestBody UpdateBoardRequest request
    ) {
        return ResponseEntity.ok(boardService.updateBoard(userId, orgRole, boardId, request));
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        boardService.deleteBoard(userId, orgRole, boardId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{boardId}/archive")
    public ResponseEntity<BoardResponse> toggleArchive(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        return ResponseEntity.ok(boardService.toggleArchive(userId, orgRole, boardId));
    }
}
