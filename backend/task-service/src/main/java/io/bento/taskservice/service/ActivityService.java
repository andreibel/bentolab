package io.bento.taskservice.service;

import io.bento.taskservice.entity.Activity;
import io.bento.taskservice.entity.embedded.ActivityDetails;
import io.bento.taskservice.enums.ActivityAction;
import io.bento.taskservice.enums.EntityType;
import io.bento.taskservice.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    public void log(String orgId, String issueId, String boardId, String sprintId,
                    String userId, EntityType entityType, ActivityAction action,
                    ActivityDetails details) {
        activityRepository.save(Activity.builder()
                .orgId(orgId)
                .issueId(issueId)
                .boardId(boardId)
                .sprintId(sprintId)
                .userId(userId)
                .entityType(entityType)
                .action(action)
                .details(details)
                .createdAt(Instant.now())
                .build());
    }

    public Page<Activity> getIssueActivities(String orgId, String issueId, Pageable pageable) {
        return activityRepository.findAllByOrgIdAndIssueId(orgId, issueId, pageable);
    }

    public Page<Activity> getBoardActivities(String orgId, String boardId, Pageable pageable) {
        return activityRepository.findAllByOrgIdAndBoardId(orgId, boardId, pageable);
    }
}
