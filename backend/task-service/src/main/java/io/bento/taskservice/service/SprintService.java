package io.bento.taskservice.service;

import io.bento.taskservice.client.BoardServiceClient;
import io.bento.taskservice.dto.request.CompleteSprintRequest;
import io.bento.taskservice.dto.request.CreateSprintRequest;
import io.bento.taskservice.dto.request.UpdateSprintRequest;
import io.bento.taskservice.entity.Issue;
import io.bento.taskservice.entity.Sprint;
import io.bento.taskservice.enums.SprintStatus;
import io.bento.kafka.event.SprintCompletedEvent;
import io.bento.taskservice.event.SprintEventPublisher;
import io.bento.kafka.event.SprintStartedEvent;
import io.bento.taskservice.exception.ActiveSprintAlreadyExistsException;
import io.bento.taskservice.exception.SprintNotFoundException;
import io.bento.taskservice.repository.IssueRepository;
import io.bento.taskservice.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final IssueRepository issueRepository;
    private final SprintEventPublisher sprintEventPublisher;
    private final BoardServiceClient boardServiceClient;

    public List<Sprint> getSprints(String orgId, String boardId) {
        return sprintRepository.findAllByOrgIdAndBoardId(orgId, boardId);
    }

    public Sprint getSprint(String orgId, String sprintId) {
        return sprintRepository.findByOrgIdAndId(orgId, sprintId)
                .orElseThrow(() -> new SprintNotFoundException(sprintId));
    }

    public Sprint createSprint(String orgId, String userId, CreateSprintRequest request) {
        Sprint sprint = Sprint.builder()
                .orgId(orgId)
                .boardId(request.boardId())
                .name(request.name())
                .goal(request.goal())
                .status(SprintStatus.PLANNED)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .duration(request.duration() != null ? request.duration() : 14)
                .createdBy(userId)
                .createdAt(Instant.now())
                .build();

        return sprintRepository.save(sprint);
    }

    public Sprint updateSprint(String orgId, String sprintId, UpdateSprintRequest request) {
        Sprint sprint = getSprint(orgId, sprintId);

        if (request.name() != null) sprint.setName(request.name());
        if (request.goal() != null) sprint.setGoal(request.goal());
        if (request.startDate() != null) sprint.setStartDate(request.startDate());
        if (request.endDate() != null) sprint.setEndDate(request.endDate());

        return sprintRepository.save(sprint);
    }

    public Sprint startSprint(String orgId, String sprintId) {
        Sprint sprint = getSprint(orgId, sprintId);

        if (sprintRepository.existsByOrgIdAndBoardIdAndStatus(orgId, sprint.getBoardId(), SprintStatus.ACTIVE)) {
            throw new ActiveSprintAlreadyExistsException(sprint.getBoardId());
        }

        sprint.setStatus(SprintStatus.ACTIVE);
        sprint = sprintRepository.save(sprint);

        List<String> memberIds = boardServiceClient.getBoardMemberIds(sprint.getBoardId());
        sprintEventPublisher.publishSprintStarted(new SprintStartedEvent(
                sprint.getId(), sprint.getBoardId(), orgId, sprint.getName(),
                sprint.getStartDate() != null ? sprint.getStartDate().toString() : null,
                sprint.getEndDate() != null ? sprint.getEndDate().toString() : null,
                memberIds
        ));

        return sprint;
    }

    public Sprint completeSprint(String orgId, String sprintId, CompleteSprintRequest request) {
        Sprint sprint = getSprint(orgId, sprintId);

        // Move incomplete issues to backlog or next sprint
        List<Issue> issues = issueRepository.findAllByOrgIdAndSprintId(orgId, sprintId);
        int completedCount = 0;
        int remainingCount = 0;
        for (Issue issue : issues) {
            if (issue.getCompletedAt() == null) {
                issue.setSprintId(request.moveIncompleteToSprintId());
                issueRepository.save(issue);
                remainingCount++;
            } else {
                completedCount++;
            }
        }

        sprint.setStatus(SprintStatus.COMPLETED);
        sprint.setCompletedAt(Instant.now());
        if (request.retrospective() != null) {
            sprint.setRetrospective(request.retrospective());
        }

        sprint = sprintRepository.save(sprint);

        List<String> memberIds = boardServiceClient.getBoardMemberIds(sprint.getBoardId());
        sprintEventPublisher.publishSprintCompleted(new SprintCompletedEvent(
                sprint.getId(), sprint.getBoardId(), orgId, sprint.getName(),
                completedCount, remainingCount, memberIds
        ));

        return sprint;
    }
}
