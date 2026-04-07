package io.bento.taskservice.dto.request;

import io.bento.taskservice.enums.IssuePriority;
import io.bento.taskservice.enums.IssueSeverity;
import io.bento.taskservice.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record CreateIssueRequest(

        @NotBlank(message = "Board ID is required")
        String boardId,

        @NotBlank(message = "Board key is required")
        @Size(max = 10, message = "Board key must be at most 10 characters")
        String boardKey,

        @NotNull(message = "Issue type is required")
        IssueType type,

        @NotNull(message = "Priority is required")
        IssuePriority priority,

        IssueSeverity severity,

        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must be at most 500 characters")
        String title,

        String description,

        String columnId,

        String assigneeId,
        String sprintId,
        String epicId,
        String parentIssueId,
        String milestoneId,

        Integer storyPoints,
        Double estimatedHours,

        Instant startDate,
        Instant dueDate,

        List<String> labelIds,
        List<String> components
) {}
