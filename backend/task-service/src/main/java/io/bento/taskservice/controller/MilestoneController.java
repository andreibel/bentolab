package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateMilestoneRequest;
import io.bento.taskservice.dto.request.UpdateMilestoneRequest;
import io.bento.taskservice.dto.response.MilestoneResponse;
import io.bento.taskservice.service.MilestoneService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService  milestoneService;
    private final TaskAccessService taskAccessService;

    /** GET /api/milestones?boardId=... */
    @GetMapping
    public ResponseEntity<List<MilestoneResponse>> list(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam                String boardId) {

        taskAccessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(milestoneService.getMilestones(orgId, boardId));
    }

    /** GET /api/milestones/{milestoneId} */
    @GetMapping("/{milestoneId}")
    public ResponseEntity<MilestoneResponse> get(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String milestoneId) {

        taskAccessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(milestoneService.getMilestone(milestoneId, orgId));
    }

    /** POST /api/milestones */
    @PostMapping
    public ResponseEntity<MilestoneResponse> create(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody           CreateMilestoneRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(milestoneService.createMilestone(orgId, userId, orgRole, req));
    }

    /** PATCH /api/milestones/{milestoneId} */
    @PatchMapping("/{milestoneId}")
    public ResponseEntity<MilestoneResponse> update(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String milestoneId,
            @Valid @RequestBody           UpdateMilestoneRequest req) {

        return ResponseEntity.ok(
                milestoneService.updateMilestone(milestoneId, orgId, userId, orgRole, req));
    }

    /** DELETE /api/milestones/{milestoneId} */
    @DeleteMapping("/{milestoneId}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String milestoneId) {

        milestoneService.deleteMilestone(milestoneId, orgId, userId, orgRole);
        return ResponseEntity.noContent().build();
    }
}