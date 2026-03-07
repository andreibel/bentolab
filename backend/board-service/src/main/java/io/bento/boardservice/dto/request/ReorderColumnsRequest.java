package io.bento.boardservice.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record ReorderColumnsRequest(
        @NotEmpty(message = "Column IDs list cannot be empty") List<UUID> columnIds
) {
}
