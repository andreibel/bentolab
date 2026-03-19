package io.bento.taskservice.dto.response;

import java.util.List;

public record SprintEndingSoonDto(
        String sprintId,
        String boardId,
        String orgId,
        String sprintName,
        String endDate,
        List<String> memberIds
) {}
