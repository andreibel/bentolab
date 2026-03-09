package io.bento.taskservice.entity.embedded;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDetails {
    private String field;
    private String oldValue;
    private String newValue;
    private Object metadata;
}
