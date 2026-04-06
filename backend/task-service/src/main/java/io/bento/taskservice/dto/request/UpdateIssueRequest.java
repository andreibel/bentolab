package io.bento.taskservice.dto.request;

import io.bento.taskservice.enums.IssuePriority;
import io.bento.taskservice.enums.IssueSeverity;
import io.bento.taskservice.enums.IssueType;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record UpdateIssueRequest(

        IssueType type,
        IssuePriority priority,
        IssueSeverity severity,

        @Size(max = 500, message = "Title must be at most 500 characters")
        String title,

        String description,
        String sprintId,
        String epicId,
        Boolean clearEpicId,
        String parentIssueId,
        String milestoneId,
        Boolean clearMilestoneId,

        Integer storyPoints,
        Double estimatedHours,
        Double remainingHours,

        Instant startDate,
        Instant dueDate,

        List<String> labelIds,
        List<String> components
) {}
