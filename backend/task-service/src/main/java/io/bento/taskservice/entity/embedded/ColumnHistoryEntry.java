package io.bento.taskservice.entity.embedded;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnHistoryEntry {
    private String columnId;
    private String columnName;   // snapshot at time of move
    private Instant enteredAt;
    private Instant exitedAt;
    private Long duration;       // milliseconds
}
