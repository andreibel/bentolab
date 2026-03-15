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
import io.bento.taskservice.event.IssueAssignedEvent;
import io.bento.taskservice.event.IssueClosedEvent;
import io.bento.taskservice.event.IssueEventPublisher;
import io.bento.taskservice.event.IssuePriorityChangedEvent;
import io.bento.taskservice.event.IssueStatusChangedEvent;
import io.bento.taskservice.exception.IssueNotFoundException;
import io.bento.taskservice.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import io.bento.taskservice.entity.BoardCounter;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final ActivityService activityService;
    private final MongoTemplate mongoTemplate;
    private final IssueEventPublisher issueEventPublisher;

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

    public Page<Issue> getIssues(String orgId, String boardId, Boolean closed, Pageable pageable) {
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
                .storyPoints(request.storyPoints())
                .estimatedHours(request.estimatedHours())
                .startDate(request.startDate())
                .dueDate(request.dueDate())
                .labelIds(request.labelIds())
                .components(request.components())
                .columnHistory(new ArrayList<>(List.of(ColumnHistoryEntry.builder()
                        .columnId(request.columnId())
                        .enteredAt(Instant.now())
                        .build())))
                .createdBy(userId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        issue = issueRepository.save(issue);

        activityService.log(orgId, issue.getId(), request.boardId(), request.sprintId(),
                userId, EntityType.ISSUE, ActivityAction.CREATED, null);

        return issue;
    }

    public Issue updateIssue(String orgId, String userId, String issueId, UpdateIssueRequest request) {
        Issue issue = getIssue(orgId, issueId);

        IssuePriority oldPriority = issue.getPriority();

        if (request.type() != null) issue.setType(request.type());
        if (request.priority() != null) issue.setPriority(request.priority());
        if (request.severity() != null) issue.setSeverity(request.severity());
        if (request.title() != null) issue.setTitle(request.title());
        if (request.description() != null) issue.setDescription(request.description());
        if (request.sprintId() != null) issue.setSprintId(request.sprintId());
        if (request.epicId() != null) issue.setEpicId(request.epicId());
        if (request.parentIssueId() != null) issue.setParentIssueId(request.parentIssueId());
        if (request.storyPoints() != null) issue.setStoryPoints(request.storyPoints());
        if (request.estimatedHours() != null) issue.setEstimatedHours(request.estimatedHours());
        if (request.remainingHours() != null) issue.setRemainingHours(request.remainingHours());
        if (request.startDate() != null) issue.setStartDate(request.startDate());
        if (request.dueDate() != null) issue.setDueDate(request.dueDate());
        if (request.labelIds() != null) issue.setLabelIds(request.labelIds());
        if (request.components() != null) issue.setComponents(request.components());

        issue.setUpdatedAt(Instant.now());
        issue = issueRepository.save(issue);

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

        activityService.log(orgId, issueId, issue.getBoardId(), issue.getSprintId(),
                userId, EntityType.ISSUE, ActivityAction.DELETED, null);

        issueRepository.delete(issue);
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

    private String generateIssueKey(String boardId, String boardKey) {
        Query query = Query.query(Criteria.where("_id").is(boardId));
        Update update = new Update().inc("seq", 1).setOnInsert("boardKey", boardKey);
        FindAndModifyOptions options = FindAndModifyOptions.options().upsert(true).returnNew(true);
        BoardCounter counter = mongoTemplate.findAndModify(query, update, options, BoardCounter.class);
        assert counter != null;
        return boardKey + "-" + counter.getSeq();
    }
}
