package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public record CreateTimeLogRequest(

        @NotNull(message = "Hours spent is required")
        @Positive(message = "Hours spent must be positive")
        Double hoursSpent,

        @NotNull(message = "Date is required")
        Instant date,

        String description
) {}
