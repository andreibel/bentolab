package io.bento.taskservice.entity.embedded;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItem {
    private String id;
    private String text;
    @Builder.Default
    private Boolean checked = false;
    private String assigneeId;
    private Integer position;
}
