package io.bento.taskservice.controller;

import io.bento.taskservice.entity.Activity;
import io.bento.taskservice.service.ActivityService;
import io.bento.taskservice.service.TaskAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final TaskAccessService accessService;

    // Issue activity log: GET /api/issues/{issueId}/activities
    @GetMapping("/api/issues/{issueId}/activities")
    public ResponseEntity<Page<Activity>> getIssueActivities(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PageableDefault(size = 30) Pageable pageable) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(activityService.getIssueActivities(orgId, issueId, pageable));
    }

    // Board activity log: GET /api/issues/activities?boardId=
    @GetMapping("/api/issues/activities")
    public ResponseEntity<Page<Activity>> getBoardActivities(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam String boardId,
            @PageableDefault(size = 30) Pageable pageable) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(activityService.getBoardActivities(orgId, boardId, pageable));
    }
}
