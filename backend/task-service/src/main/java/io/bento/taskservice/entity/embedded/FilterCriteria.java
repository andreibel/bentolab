package io.bento.taskservice.entity.embedded;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterCriteria {
    private List<String> types;
    private List<String> columnIds;
    private List<String> priorities;
    private List<String> assigneeIds;
    private List<String> labelIds;
    private String sprintId;
    private Instant dueDateFrom;
    private Instant dueDateTo;
    private String searchText;
}
