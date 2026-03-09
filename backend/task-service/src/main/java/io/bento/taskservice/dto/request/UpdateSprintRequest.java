package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateSprintRequest(

        @Size(max = 200, message = "Sprint name must be at most 200 characters")
        String name,

        @Size(max = 500, message = "Goal must be at most 500 characters")
        String goal,

        Instant startDate,
        Instant endDate
) {}
