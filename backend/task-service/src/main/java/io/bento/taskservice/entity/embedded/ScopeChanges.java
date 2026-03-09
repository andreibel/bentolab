package io.bento.taskservice.entity.embedded;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScopeChanges {
    @Builder.Default
    private Integer addedCount = 0;
    @Builder.Default
    private Integer removedCount = 0;
}
