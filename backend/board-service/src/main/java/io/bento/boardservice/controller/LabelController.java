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
@RequestMapping("/api/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public ResponseEntity<List<LabelResponse>> getLabels(
            @RequestHeader("X-Org-Id") UUID orgId
    ) {
        return ResponseEntity.ok(labelService.getLabels(orgId));
    }

    @PostMapping
    public ResponseEntity<LabelResponse> createLabel(
            @RequestHeader("X-Org-Id") UUID orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody CreateLabelRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(labelService.createLabel(orgId, orgRole, request));
    }

    @PatchMapping("/{labelId}")
    public ResponseEntity<LabelResponse> updateLabel(
            @RequestHeader("X-Org-Id") UUID orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID labelId,
            @Valid @RequestBody UpdateLabelRequest request
    ) {
        return ResponseEntity.ok(labelService.updateLabel(orgId, orgRole, labelId, request));
    }

    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> deleteLabel(
            @RequestHeader("X-Org-Id") UUID orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable UUID labelId
    ) {
        labelService.deleteLabel(orgId, orgRole, labelId);
        return ResponseEntity.noContent().build();
    }
}