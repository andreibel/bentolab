package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateEpicRequest;
import io.bento.taskservice.dto.request.UpdateEpicRequest;
import io.bento.taskservice.dto.response.EpicResponse;
import io.bento.taskservice.entity.Epic;
import io.bento.taskservice.exception.EpicNotFoundException;
import io.bento.taskservice.repository.EpicRepository;
import io.bento.taskservice.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class EpicService {

    private static final String DEFAULT_COLOR = "#6366f1";

    private final EpicRepository     epicRepository;
    private final IssueRepository    issueRepository;
    private final TaskAccessService  taskAccessService;
    private final MongoTemplate      mongoTemplate;

    // ── List ─────────────────────────────────────────────────────────────────

    public List<EpicResponse> getEpics(String orgId, String boardId) {
        return epicRepository.findAllByOrgIdAndBoardId(orgId, boardId)
                .stream()
                .map(e -> toResponse(e, issueRepository.countByOrgIdAndEpicId(orgId, e.getId())))
                .toList();
    }

    // ── Get ──────────────────────────────────────────────────────────────────

    public EpicResponse getEpic(String epicId, String orgId) {
        Epic epic = findOrThrow(epicId, orgId);
        long count = issueRepository.countByOrgIdAndEpicId(orgId, epicId);
        return toResponse(epic, count);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    public EpicResponse createEpic(String orgId, String userId, String orgRole,
                                   CreateEpicRequest req) {
        taskAccessService.requireOrgMember(orgRole);

        Epic epic = Epic.builder()
                .orgId(orgId)
                .boardId(req.boardId())
                .title(req.title())
                .description(req.description())
                .color(req.color() != null ? req.color() : DEFAULT_COLOR)
                .startDate(req.startDate())
                .endDate(req.endDate())
                .ownerId(userId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Epic saved = epicRepository.save(epic);
        return toResponse(saved, 0L);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    public EpicResponse updateEpic(String epicId, String orgId, String userId, String orgRole,
                                   UpdateEpicRequest req) {
        Epic epic = findOrThrow(epicId, orgId);
        taskAccessService.requireSelfOrAdmin(userId, epic.getOwnerId(), orgRole);

        if (req.title()       != null) epic.setTitle(req.title());
        if (req.description() != null) epic.setDescription(req.description());
        if (req.color()       != null) epic.setColor(req.color());
        if (req.status()      != null) epic.setStatus(req.status());
        if (req.startDate()   != null) epic.setStartDate(req.startDate());
        if (req.endDate()     != null) epic.setEndDate(req.endDate());

        epic.setUpdatedAt(Instant.now());
        Epic saved = epicRepository.save(epic);
        long count = issueRepository.countByOrgIdAndEpicId(orgId, epicId);
        return toResponse(saved, count);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public void deleteEpic(String epicId, String orgId, String userId, String orgRole) {
        Epic epic = findOrThrow(epicId, orgId);
        taskAccessService.requireSelfOrAdmin(userId, epic.getOwnerId(), orgRole);

        // Detach all issues that reference this epic
        Query issueQuery = new Query(
                Criteria.where("orgId").is(orgId).and("epicId").is(epicId));
        Update clearEpic = new Update().unset("epicId");
        mongoTemplate.updateMulti(issueQuery, clearEpic,
                io.bento.taskservice.entity.Issue.class);

        epicRepository.deleteById(epicId);
    }

    // ── Date refresh ─────────────────────────────────────────────────────────

    /**
     * Recomputes startDate = min(issue.startDate) and endDate = max(issue.dueDate)
     * for the given epic from its current issues. Call this whenever issues are
     * created, updated, or deleted.
     */
    public void refreshEpicDates(String orgId, String epicId) {
        Epic epic = epicRepository.findByIdAndOrgId(epicId, orgId).orElse(null);
        if (epic == null) return;

        List<io.bento.taskservice.entity.Issue> issues =
                issueRepository.findAllByOrgIdAndEpicId(orgId, epicId);

        Instant minStart = issues.stream()
                .map(io.bento.taskservice.entity.Issue::getStartDate)
                .filter(Objects::nonNull)
                .min(Instant::compareTo)
                .orElse(null);

        Instant maxDue = issues.stream()
                .map(io.bento.taskservice.entity.Issue::getDueDate)
                .filter(Objects::nonNull)
                .max(Instant::compareTo)
                .orElse(null);

        epic.setStartDate(minStart);
        epic.setEndDate(maxDue);
        epic.setUpdatedAt(Instant.now());
        epicRepository.save(epic);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Epic findOrThrow(String epicId, String orgId) {
        return epicRepository.findByIdAndOrgId(epicId, orgId)
                .orElseThrow(() -> new EpicNotFoundException(epicId));
    }

    private EpicResponse toResponse(Epic e, long issueCount) {
        return new EpicResponse(
                e.getId(),
                e.getOrgId(),
                e.getBoardId(),
                e.getTitle(),
                e.getDescription(),
                e.getColor(),
                e.getStatus(),
                e.getStartDate(),
                e.getEndDate(),
                e.getOwnerId(),
                issueCount,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}