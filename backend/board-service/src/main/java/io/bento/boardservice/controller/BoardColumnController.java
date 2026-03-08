package io.bento.boardservice.controller;

import io.bento.boardservice.dto.request.CreateColumnRequest;
import io.bento.boardservice.dto.request.ReorderColumnsRequest;
import io.bento.boardservice.dto.request.UpdateColumnRequest;
import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.service.BoardColumnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/columns")
@RequiredArgsConstructor
public class BoardColumnController {

    private final BoardColumnService boardColumnService;

    @GetMapping
    public ResponseEntity<List<BoardColumnResponse>> getColumns(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        return ResponseEntity.ok(boardColumnService.getColumns(userId, orgRole, boardId));
    }

    @PostMapping
    public ResponseEntity<BoardColumnResponse> createColumn(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @Valid @RequestBody CreateColumnRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boardColumnService.createColumn(userId, orgRole, boardId, request));
    }

    @PatchMapping("/{columnId}")
    public ResponseEntity<BoardColumnResponse> updateColumn(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID columnId,
            @Valid @RequestBody UpdateColumnRequest request
    ) {
        return ResponseEntity.ok(boardColumnService.updateColumn(userId, orgRole, boardId, columnId, request));
    }

    @DeleteMapping("/{columnId}")
    public ResponseEntity<Void> deleteColumn(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID columnId
    ) {
        boardColumnService.deleteColumn(userId, orgRole, boardId, columnId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/reorder")
    public ResponseEntity<List<BoardColumnResponse>> reorderColumns(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @Valid @RequestBody ReorderColumnsRequest request
    ) {
        return ResponseEntity.ok(boardColumnService.reorderColumns(userId, orgRole, boardId, request));
    }
}
