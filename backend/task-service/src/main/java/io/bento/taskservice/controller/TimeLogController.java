package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateTimeLogRequest;
import io.bento.taskservice.entity.TimeLog;
import io.bento.taskservice.service.TaskAccessService;
import io.bento.taskservice.service.TimeLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/timelogs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TimeLogService timeLogService;
    private final TaskAccessService accessService;

    @GetMapping
    public ResponseEntity<List<TimeLog>> getTimeLogs(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(timeLogService.getTimeLogs(orgId, issueId));
    }

    // Any org member can log time
    @PostMapping
    public ResponseEntity<TimeLog> createTimeLog(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @Valid @RequestBody CreateTimeLogRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(timeLogService.createTimeLog(orgId, userId, issueId, request));
    }

    // Only the logger or admin can delete a time log
    @DeleteMapping("/{timeLogId}")
    public ResponseEntity<Void> deleteTimeLog(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PathVariable String timeLogId) {
        accessService.requireOrgMember(orgRole);
        timeLogService.deleteTimeLog(orgId, userId, timeLogId);
        return ResponseEntity.noContent().build();
    }
}
