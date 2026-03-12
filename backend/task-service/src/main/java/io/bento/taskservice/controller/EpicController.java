package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateEpicRequest;
import io.bento.taskservice.dto.request.UpdateEpicRequest;
import io.bento.taskservice.dto.response.EpicResponse;
import io.bento.taskservice.entity.Issue;
import io.bento.taskservice.repository.IssueRepository;
import io.bento.taskservice.service.EpicService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/epics")
@RequiredArgsConstructor
public class EpicController {

    private final EpicService       epicService;
    private final IssueRepository   issueRepository;
    private final TaskAccessService taskAccessService;

    /** GET /api/epics?boardId=... — list all epics for a board */
    @GetMapping
    public ResponseEntity<List<EpicResponse>> list(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam                String boardId) {

        taskAccessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(epicService.getEpics(orgId, boardId));
    }

    /** GET /api/epics/{epicId} */
    @GetMapping("/{epicId}")
    public ResponseEntity<EpicResponse> get(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String epicId) {

        taskAccessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(epicService.getEpic(epicId, orgId));
    }

    /** POST /api/epics */
    @PostMapping
    public ResponseEntity<EpicResponse> create(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody           CreateEpicRequest req) {

        EpicResponse created = epicService.createEpic(orgId, userId, orgRole, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** PATCH /api/epics/{epicId} */
    @PatchMapping("/{epicId}")
    public ResponseEntity<EpicResponse> update(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String epicId,
            @Valid @RequestBody           UpdateEpicRequest req) {

        return ResponseEntity.ok(epicService.updateEpic(epicId, orgId, userId, orgRole, req));
    }

    /** DELETE /api/epics/{epicId} — also detaches all child issues */
    @DeleteMapping("/{epicId}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-User-Id")  String userId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String epicId) {

        epicService.deleteEpic(epicId, orgId, userId, orgRole);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/epics/{epicId}/issues — paginated list of issues in this epic */
    @GetMapping("/{epicId}/issues")
    public ResponseEntity<Page<Issue>> issues(
            @RequestHeader("X-Org-Id")   String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable                String epicId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "50")  int size) {

        taskAccessService.requireOrgMember(orgRole);
        epicService.getEpic(epicId, orgId); // verify epic exists in this org

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(issueRepository.findAllByOrgIdAndEpicId(orgId, epicId, pageable));
    }
}