package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CompleteSprintRequest;
import io.bento.taskservice.dto.request.CreateSprintRequest;
import io.bento.taskservice.dto.request.UpdateSprintRequest;
import io.bento.taskservice.entity.Sprint;
import io.bento.taskservice.service.SprintService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;
    private final TaskAccessService accessService;

    // Any org member can view sprints
    @GetMapping
    public ResponseEntity<List<Sprint>> getSprints(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam String boardId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(sprintService.getSprints(orgId, boardId));
    }

    @GetMapping("/{sprintId}")
    public ResponseEntity<Sprint> getSprint(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String sprintId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(sprintService.getSprint(orgId, sprintId));
    }

    // Only org admins can create/manage sprints
    @PostMapping
    public ResponseEntity<Sprint> createSprint(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody CreateSprintRequest request) {
        accessService.requireOrgAdmin(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(sprintService.createSprint(orgId, userId, request));
    }

    @PatchMapping("/{sprintId}")
    public ResponseEntity<Sprint> updateSprint(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String sprintId,
            @Valid @RequestBody UpdateSprintRequest request) {
        accessService.requireOrgAdmin(orgRole);
        return ResponseEntity.ok(sprintService.updateSprint(orgId, sprintId, request));
    }

    @PostMapping("/{sprintId}/start")
    public ResponseEntity<Sprint> startSprint(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String sprintId) {
        accessService.requireOrgAdmin(orgRole);
        return ResponseEntity.ok(sprintService.startSprint(orgId, sprintId));
    }

    @PostMapping("/{sprintId}/complete")
    public ResponseEntity<Sprint> completeSprint(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String sprintId,
            @RequestBody CompleteSprintRequest request) {
        accessService.requireOrgAdmin(orgRole);
        return ResponseEntity.ok(sprintService.completeSprint(orgId, sprintId, request));
    }
}
