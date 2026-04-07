package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.AssignIssueRequest;
import io.bento.taskservice.dto.request.CreateIssueRequest;
import io.bento.taskservice.dto.request.MoveIssueRequest;
import io.bento.taskservice.dto.request.UpdateIssueRequest;
import io.bento.taskservice.entity.Issue;
import io.bento.taskservice.entity.embedded.ActivityDetails;
import io.bento.taskservice.entity.embedded.ColumnHistoryEntry;
import io.bento.taskservice.enums.ActivityAction;
import io.bento.taskservice.enums.EntityType;
import io.bento.taskservice.enums.IssuePriority;
import io.bento.kafka.event.IssueAssignedEvent;
import io.bento.kafka.event.IssueClosedEvent;
import io.bento.kafka.event.IssueCreatedEvent;
import io.bento.taskservice.event.IssueEventPublisher;
import io.bento.kafka.event.IssuePriorityChangedEvent;
import io.bento.kafka.event.IssueStatusChangedEvent;
import io.bento.taskservice.exception.IssueNotFoundException;
import io.bento.taskservice.dto.response.IssueSearchResultDto;
import io.bento.taskservice.entity.Comment;
import io.bento.taskservice.repository.CommentRepository;
import io.bento.taskservice.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import io.bento.taskservice.entity.BoardCounter;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final CommentRepository commentRepository;
    private final ActivityService activityService;
    private final MongoTemplate mongoTemplate;
    private final IssueEventPublisher issueEventPublisher;
    private final EpicService epicService;

    public Page<Issue> getMyIssues(String orgId, String userId, String relation, Boolean closed, Pageable pageable) {
        return switch (relation) {
            case "assigned" -> closed == null
                    ? issueRepository.findAllByOrgIdAndAssigneeId(orgId, userId, pageable)
                    : closed
                        ? issueRepository.findAllClosedByOrgIdAndAssigneeId(orgId, userId, pageable)
                        : issueRepository.findAllOpenByOrgIdAndAssigneeId(orgId, userId, pageable);
            case "created" -> closed == null
                    ? issueRepository.findAllByOrgIdAndReporterId(orgId, userId, pageable)
                    : closed
                        ? issueRepository.findAllClosedByOrgIdAndReporterId(orgId, userId, pageable)
                        : issueRepository.findAllOpenByOrgIdAndReporterId(orgId, userId, pageable);
            default -> closed == null
                    ? issueRepository.findAllByOrgIdAndUserId(orgId, userId, pageable)
                    : closed
                        ? issueRepository.findAllClosedByOrgIdAndUserId(orgId, userId, pageable)
                        : issueRepository.findAllOpenByOrgIdAndUserId(orgId, userId, pageable);
        };
    }

    public Page<Issue> getIssues(String orgId, String boardId, Boolean closed, Boolean onBoard, String sprintId, Pageable pageable) {
        // Scrum board: filter by sprint
        if (sprintId != null) {
            return issueRepository.findAllOpenByOrgIdAndBoardIdAndSprintId(orgId, boardId, sprintId, pageable);
        }
        // Kanban board view: only issues placed in a column
        if (Boolean.TRUE.equals(onBoard)) {
            return issueRepository.findAllOpenByOrgIdAndBoardIdOnBoard(orgId, boardId, pageable);
        }
        // Backlog view: issues not yet on the board
        if (Boolean.FALSE.equals(onBoard)) {
            return issueRepository.findAllByOrgIdAndBoardIdInBacklog(orgId, boardId, pageable);
        }
        // Default: all issues (existing behaviour)
        if (closed != null) {
            if (closed) {
                return issueRepository.findAllByOrgIdAndBoardIdAndClosed(orgId, boardId, true, pageable);
            } else {
                return issueRepository.findAllOpenByOrgIdAndBoardId(orgId, boardId, pageable);
            }
        }
        return issueRepository.findAllByOrgIdAndBoardId(orgId, boardId, pageable);
    }

    public Issue getIssue(String orgId, String issueId) {
        return issueRepository.findByOrgIdAndId(orgId, issueId)
                .orElseThrow(() -> new IssueNotFoundException(issueId));
    }

    public Issue createIssue(String orgId, String userId, CreateIssueRequest request) {
        String issueKey = generateIssueKey(request.boardId(), request.boardKey());

        Issue issue = Issue.builder()
                .orgId(orgId)
                .boardId(request.boardId())
                .issueKey(issueKey)
                .type(request.type())
                .priority(request.priority())
                .severity(request.severity())
                .title(request.title())
                .description(request.description())
                .columnId(request.columnId())
                .position(0)
                .reporterId(userId)
                .assigneeId(request.assigneeId())
                .sprintId(request.sprintId())
                .epicId(request.epicId())
                .parentIssueId(request.parentIssueId())
                .milestoneId(request.milestoneId())
                .storyPoints(request.storyPoints())
                .estimatedHours(request.estimatedHours())
                .startDate(request.startDate())
                .dueDate(request.dueDate())
                .labelIds(request.labelIds())
                .components(request.components())
                .columnHistory(request.columnId() != null
                        ? new ArrayList<>(List.of(ColumnHistoryEntry.builder()
                                .columnId(request.columnId())
                                .enteredAt(Instant.now())
                                .build()))
                        : new ArrayList<>())
                .createdBy(userId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        issue = issueRepository.save(issue);

        if (issue.getEpicId() != null) {
            epicService.refreshEpicDates(orgId, issue.getEpicId());
        }

        activityService.log(orgId, issue.getId(), request.boardId(), request.sprintId(),
                userId, EntityType.ISSUE, ActivityAction.CREATED, null);

        issueEventPublisher.publishIssueCreated(new IssueCreatedEvent(
                issue.getId(), issue.getBoardId(), orgId, issue.getIssueKey(),
                issue.getTitle(), issue.getColumnId(), userId, issue.getAssigneeId(),
                Instant.now().toString()
        ));

        return issue;
    }

    public Issue updateIssue(String orgId, String userId, String issueId, UpdateIssueRequest request) {
        Issue issue = getIssue(orgId, issueId);

        IssuePriority oldPriority = issue.getPriority();
        String oldEpicId = issue.getEpicId();

        if (request.type() != null) issue.setType(request.type());
        if (request.priority() != null) issue.setPriority(request.priority());
        if (request.severity() != null) issue.setSeverity(request.severity());
        if (request.title() != null) issue.setTitle(request.title());
        if (request.description() != null) issue.setDescription(request.description());
        if (request.sprintId() != null) issue.setSprintId(request.sprintId());
        if (Boolean.TRUE.equals(request.clearEpicId())) issue.setEpicId(null);
        else if (request.epicId() != null) issue.setEpicId(request.epicId());
        if (request.parentIssueId() != null) issue.setParentIssueId(request.parentIssueId());
        if (Boolean.TRUE.equals(request.clearMilestoneId())) issue.setMilestoneId(null);
        else if (request.milestoneId() != null) issue.setMilestoneId(request.milestoneId());
        if (request.storyPoints() != null) issue.setStoryPoints(request.storyPoints());
        if (request.estimatedHours() != null) issue.setEstimatedHours(request.estimatedHours());
        if (request.remainingHours() != null) issue.setRemainingHours(request.remainingHours());
        if (request.startDate() != null) issue.setStartDate(request.startDate());
        if (request.dueDate() != null) issue.setDueDate(request.dueDate());
        if (request.labelIds() != null) issue.setLabelIds(request.labelIds());
        if (request.components() != null) issue.setComponents(request.components());

        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);

        // Refresh epic dates for any affected epic
        boolean epicCleared = Boolean.TRUE.equals(request.clearEpicId());
        boolean epicChanged = epicCleared || (request.epicId() != null && !request.epicId().equals(oldEpicId));
        boolean datesChanged = request.startDate() != null || request.dueDate() != null;
        if (epicChanged && oldEpicId != null) {
            epicService.refreshEpicDates(orgId, oldEpicId);
        }
        if (!epicCleared && (epicChanged || datesChanged) && issue.getEpicId() != null) {
            epicService.refreshEpicDates(orgId, issue.getEpicId());
        }

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.UPDATED, null);

        // Publish priority change event if escalated to CRITICAL or HIGH
        if (request.priority() != null && request.priority() != oldPriority) {
            IssuePriority newPriority = request.priority();
            if (newPriority == IssuePriority.CRITICAL || newPriority == IssuePriority.HIGH) {
                issueEventPublisher.publishIssuePriorityChanged(new IssuePriorityChangedEvent(
                        issue.getId(), issue.getBoardId(), orgId, issue.getIssueKey(),
                        issue.getTitle(),
                        oldPriority != null ? oldPriority.name() : null,
                        newPriority.name(),
                        userId, issue.getAssigneeId(),
                        Instant.now().toString()
                ));
            }
        }

        return issue;
    }

    public void deleteIssue(String orgId, String userId, String issueId) {
        Issue issue = getIssue(orgId, issueId);
        String epicId = issue.getEpicId();

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.DELETED, null);

        issueRepository.delete(issue);

        if (epicId != null) {
            epicService.refreshEpicDates(orgId, epicId);
        }
    }

    public Issue moveIssue(String orgId, String userId, String issueId, MoveIssueRequest request) {
        Issue issue = getIssue(orgId, issueId);

        String previousColumnId = issue.getColumnId();

        // Close the previous column history entry
        if (issue.getColumnHistory() != null && !issue.getColumnHistory().isEmpty()) {
            ColumnHistoryEntry last = issue.getColumnHistory().getLast();
            if (last.getExitedAt() == null) {
                last.setExitedAt(Instant.now());
                last.setDuration(Instant.now().toEpochMilli() - last.getEnteredAt().toEpochMilli());
            }
        }

        // Add new column history entry
        List<ColumnHistoryEntry> history = issue.getColumnHistory() != null
                ? new ArrayList<>(issue.getColumnHistory()) : new ArrayList<>();
        history.add(ColumnHistoryEntry.builder()
                .columnId(request.columnId())
                .enteredAt(Instant.now())
                .build());

        issue.setColumnId(request.columnId());
        issue.setPosition(request.position());
        issue.setColumnHistory(history);
        issue.setStatusChangeCount(issue.getStatusChangeCount() + 1);
        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.COLUMN_CHANGED,
                ActivityDetails.builder()
                        .field("columnId")
                        .oldValue(previousColumnId)
                        .newValue(request.columnId())
                        .build());

        // Publish status changed event if column names are provided
        if (request.fromColumnName() != null && request.toColumnName() != null) {
            issueEventPublisher.publishIssueStatusChanged(new IssueStatusChangedEvent(
                    issue.getId(), issue.getBoardId(), orgId, issue.getIssueKey(),
                    issue.getTitle(),
                    request.fromColumnName(), request.toColumnName(),
                    userId, issue.getAssigneeId(), issue.getReporterId(),
                    issue.getWatcherIds() != null ? issue.getWatcherIds() : Collections.emptyList(),
                    Instant.now().toString()
            ));
        }

        return issue;
    }

    public Issue assignIssue(String orgId, String userId, String issueId, AssignIssueRequest request) {
        Issue issue = getIssue(orgId, issueId);
        String previousAssignee = issue.getAssigneeId();

        issue.setAssigneeId(request.assigneeId());
        issue.setReassignmentCount(issue.getReassignmentCount() + 1);
        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.ASSIGNED,
                ActivityDetails.builder()
                        .field("assigneeId")
                        .oldValue(previousAssignee)
                        .newValue(request.assigneeId())
                        .build());

        // Publish assignment event (only when actually assigning someone)
        if (request.assigneeId() != null && !request.assigneeId().equals(userId)) {
            issueEventPublisher.publishIssueAssigned(new IssueAssignedEvent(
                    issue.getId(), issue.getBoardId(), orgId, issue.getIssueKey(),
                    issue.getTitle(), request.assigneeId(), userId,
                    Instant.now().toString()
            ));
        }

        return issue;
    }

    public Issue closeIssue(String orgId, String userId, String issueId) {
        Issue issue = getIssue(orgId, issueId);
        issue.setClosed(true);
        issue.setClosedAt(Instant.now());
        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.CLOSED, null);

        issueEventPublisher.publishIssueClosed(new IssueClosedEvent(
                issue.getId(), issue.getBoardId(), orgId, issue.getIssueKey(),
                issue.getTitle(), userId, issue.getAssigneeId(), issue.getReporterId(),
                issue.getClosedAt().toString()
        ));

        return issue;
    }

    public Issue reopenIssue(String orgId, String userId, String issueId) {
        Issue issue = getIssue(orgId, issueId);
        issue.setClosed(false);
        issue.setClosedAt(null);
        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);
        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.REOPENED, null);
        return issue;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    public List<IssueSearchResultDto> search(String orgId, String q, int limit) {
        if (q == null || q.isBlank()) return List.of();

        // Escape the query so regex-special chars don't break the query
        String escaped = Pattern.quote(q.trim());
        Pageable page  = PageRequest.of(0, limit);

        // Track seen issue IDs so we don't surface duplicates (title/desc match wins over comment match)
        Map<String, IssueSearchResultDto> seen = new LinkedHashMap<>();

        // 1. Match issues whose title or description contains the query
        List<Issue> issueMatches = issueRepository.searchByOrgIdAndText(orgId, escaped, page);
        for (Issue issue : issueMatches) {
            if (seen.size() >= limit) break;
            String matchIn = matchesTitle(issue.getTitle(), q) ? "TITLE" : "DESCRIPTION";
            String snippet = matchIn.equals("TITLE")
                    ? issue.getTitle()
                    : buildSnippet(issue.getDescription(), q);
            seen.put(issue.getId(), new IssueSearchResultDto(
                    issue.getId(), issue.getIssueKey(), issue.getTitle(),
                    issue.getBoardId(),
                    issue.getPriority() != null ? issue.getPriority().name() : null,
                    issue.getType() != null ? issue.getType().name() : null,
                    Boolean.TRUE.equals(issue.getClosed()),
                    issue.getAssigneeId(),
                    issue.getReporterId(),
                    issue.getEpicId(),
                    issue.getLabelIds() != null ? issue.getLabelIds() : List.of(),
                    formatDate(issue.getStartDate()),
                    formatDate(issue.getDueDate()),
                    matchIn, snippet, null));
        }

        // 2. Match comments whose text contains the query, surface their parent issue
        if (seen.size() < limit) {
            List<Comment> commentMatches = commentRepository.searchByOrgIdAndText(orgId, escaped,
                    PageRequest.of(0, limit * 2));
            for (Comment comment : commentMatches) {
                if (seen.size() >= limit) break;
                if (seen.containsKey(comment.getIssueId())) continue; // issue already matched

                issueRepository.findByOrgIdAndId(orgId, comment.getIssueId()).ifPresent(issue -> {
                    if (seen.size() < limit) {
                        seen.put(issue.getId(), new IssueSearchResultDto(
                                issue.getId(), issue.getIssueKey(), issue.getTitle(),
                                issue.getBoardId(),
                                issue.getPriority() != null ? issue.getPriority().name() : null,
                                issue.getType() != null ? issue.getType().name() : null,
                                Boolean.TRUE.equals(issue.getClosed()),
                                issue.getAssigneeId(),
                                issue.getReporterId(),
                                issue.getEpicId(),
                                issue.getLabelIds() != null ? issue.getLabelIds() : List.of(),
                                formatDate(issue.getStartDate()),
                                formatDate(issue.getDueDate()),
                                "COMMENT", buildSnippet(comment.getText(), q),
                                comment.getUserId()));
                    }
                });
            }
        }

        return new ArrayList<>(seen.values());
    }

    private String formatDate(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneOffset.UTC).toLocalDate().toString();
    }

    private boolean matchesTitle(String title, String q) {
        return title != null && title.toLowerCase().contains(q.toLowerCase());
    }

    /** Returns up to ~120 chars around the first occurrence of the query term. */
    private String buildSnippet(String text, String q) {
        if (text == null || text.isBlank()) return "";
        int idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) return text.length() > 120 ? text.substring(0, 120) + "…" : text;
        int start = Math.max(0, idx - 40);
        int end   = Math.min(text.length(), idx + q.length() + 80);
        String snippet = text.substring(start, end).replaceAll("\\s+", " ").trim();
        if (start > 0)         snippet = "…" + snippet;
        if (end < text.length()) snippet = snippet + "…";
        return snippet;
    }

    private String generateIssueKey(String boardId, String boardKey) {
        Query query = Query.query(Criteria.where("_id").is(boardId));
        Update update = new Update().inc("seq", 1).setOnInsert("boardKey", boardKey);
        FindAndModifyOptions options = FindAndModifyOptions.options().upsert(true).returnNew(true);
        BoardCounter counter = mongoTemplate.findAndModify(query, update, options, BoardCounter.class);
        assert counter != null;
        return boardKey + "-" + counter.getSeq();
    }
}
