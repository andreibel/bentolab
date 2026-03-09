package io.bento.taskservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "board_counters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCounter {

    @Id
    private String boardId;

    private String boardKey;    // e.g. "TF"

    @Builder.Default
    private Long seq = 0L;
}
