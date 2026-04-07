package io.bento.taskservice.dto.response;

import java.util.List;

public record IssueSearchResultDto(
        String issueId,
        String issueKey,
        String title,
        String boardId,
        String priority,
        String type,
        boolean closed,
        String assigneeId,
        String reporterId,
        String epicId,
        List<String> labelIds,
        /** ISO-8601 date string (YYYY-MM-DD) or null */
        String startDate,
        /** ISO-8601 date string (YYYY-MM-DD) or null */
        String dueDate,
        /** Where the match was found: TITLE, DESCRIPTION, or COMMENT */
        String matchIn,
        /** Short excerpt (~120 chars) around the matching text */
        String snippet,
        /** Author of the matching comment; null unless matchIn == COMMENT */
        String commentAuthorId
) {}