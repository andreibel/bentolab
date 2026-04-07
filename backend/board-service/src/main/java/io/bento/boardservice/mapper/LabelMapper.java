package io.bento.boardservice.mapper;

import io.bento.boardservice.dto.response.LabelResponse;
import io.bento.boardservice.entity.Label;
import org.springframework.stereotype.Component;

@Component
public class LabelMapper {

    public LabelResponse toResponse(Label label) {
        return new LabelResponse(
                label.getId(),
                label.getOrgId(),
                label.getName(),
                label.getColor(),
                label.getDescription(),
                label.getCreatedAt()
        );
    }
}