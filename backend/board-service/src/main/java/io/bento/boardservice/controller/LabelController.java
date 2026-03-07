package io.bento.boardservice.controller;

import io.bento.boardservice.dto.request.CreateLabelRequest;
import io.bento.boardservice.dto.request.UpdateLabelRequest;
import io.bento.boardservice.dto.response.LabelResponse;
import io.bento.boardservice.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public ResponseEntity<List<LabelResponse>> getLabels(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId
    ) {
        return ResponseEntity.ok(labelService.getLabels(userId, orgRole, boardId));
    }

    @PostMapping
    public ResponseEntity<LabelResponse> createLabel(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestHeader("X-Org-Id") UUID orgId,
            @PathVariable UUID boardId,
            @Valid @RequestBody CreateLabelRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(labelService.createLabel(userId, orgRole, orgId, boardId, request));
    }

    @PatchMapping("/{labelId}")
    public ResponseEntity<LabelResponse> updateLabel(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID labelId,
            @Valid @RequestBody UpdateLabelRequest request
    ) {
        return ResponseEntity.ok(labelService.updateLabel(userId, orgRole, boardId, labelId, request));
    }

    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> deleteLabel(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID boardId,
            @PathVariable UUID labelId
    ) {
        labelService.deleteLabel(userId, orgRole, boardId, labelId);
        return ResponseEntity.noContent().build();
    }
}
