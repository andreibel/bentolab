package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateSavedFilterRequest;
import io.bento.taskservice.entity.SavedFilter;
import io.bento.taskservice.service.SavedFilterService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/filters")
@RequiredArgsConstructor
public class SavedFilterController {

    private final SavedFilterService savedFilterService;
    private final TaskAccessService accessService;

    // GET /api/issues/filters?boardId=
    @GetMapping
    public ResponseEntity<List<SavedFilter>> getFilters(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam String boardId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(savedFilterService.getFilters(orgId, boardId, userId));
    }

    // POST /api/issues/filters
    @PostMapping
    public ResponseEntity<SavedFilter> createFilter(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody CreateSavedFilterRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedFilterService.createFilter(orgId, userId, request));
    }

    // DELETE /api/issues/filters/{filterId}
    @DeleteMapping("/{filterId}")
    public ResponseEntity<Void> deleteFilter(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String filterId) {
        accessService.requireOrgMember(orgRole);
        savedFilterService.deleteFilter(orgId, userId, orgRole, filterId);
        return ResponseEntity.noContent().build();
    }
}
