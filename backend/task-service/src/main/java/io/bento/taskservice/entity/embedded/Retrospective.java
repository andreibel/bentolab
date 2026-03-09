package io.bento.taskservice.entity.embedded;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Retrospective {
    private List<String> whatWentWell;
    private List<String> whatWentWrong;
    private List<String> actionItems;
}
