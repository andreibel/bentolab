package io.bento.taskservice.dto.request;

import io.bento.taskservice.entity.embedded.Retrospective;

// moveIncompleteToSprintId null = move to backlog (no sprint)
public record CompleteSprintRequest(
        String moveIncompleteToSprintId,
        Retrospective retrospective
) {}
