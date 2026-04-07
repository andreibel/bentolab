package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateLabelRequest;
import io.bento.boardservice.dto.request.UpdateLabelRequest;
import io.bento.boardservice.dto.response.LabelResponse;
import io.bento.boardservice.entity.Label;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.LabelNotFoundException;
import io.bento.boardservice.mapper.LabelMapper;
import io.bento.boardservice.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabelService {

    private final LabelRepository labelRepository;
    private final LabelMapper labelMapper;
    private final BoardAccessService boardAccessService;

    public List<LabelResponse> getLabels(UUID orgId) {
        return labelRepository.findAllByOrgId(orgId).stream()
                .map(labelMapper::toResponse)
                .toList();
    }

    @Transactional
    public LabelResponse createLabel(UUID orgId, String orgRole, CreateLabelRequest request) {
        requireOrgAdmin(orgRole);
        Label label = Label.builder()
                .orgId(orgId)
                .name(request.name())
                .color(request.color())
                .description(request.description())
                .build();
        return labelMapper.toResponse(labelRepository.save(label));
    }

    @Transactional
    public LabelResponse updateLabel(UUID orgId, String orgRole, UUID labelId, UpdateLabelRequest request) {
        requireOrgAdmin(orgRole);
        Label label = labelRepository.findByOrgIdAndId(orgId, labelId)
                .orElseThrow(() -> new LabelNotFoundException("Label not found: " + labelId));

        if (request.name() != null && !request.name().isBlank()) label.setName(request.name());
        if (request.color() != null) label.setColor(request.color());
        if (request.description() != null) label.setDescription(request.description());

        return labelMapper.toResponse(labelRepository.save(label));
    }

    @Transactional
    public void deleteLabel(UUID orgId, String orgRole, UUID labelId) {
        requireOrgAdmin(orgRole);
        Label label = labelRepository.findByOrgIdAndId(orgId, labelId)
                .orElseThrow(() -> new LabelNotFoundException("Label not found: " + labelId));
        labelRepository.delete(label);
    }

    private void requireOrgAdmin(String orgRole) {
        if (!boardAccessService.isOrgAdmin(orgRole)) {
            throw new BoardAccessDeniedException("Access denied: org admin or owner required");
        }
    }
}
