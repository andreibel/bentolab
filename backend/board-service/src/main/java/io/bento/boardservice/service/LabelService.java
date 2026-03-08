package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateLabelRequest;
import io.bento.boardservice.dto.request.UpdateLabelRequest;
import io.bento.boardservice.dto.response.LabelResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.Label;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.exception.LabelNotFoundException;
import io.bento.boardservice.mapper.LabelMapper;
import io.bento.boardservice.repository.BoardRepository;
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
    private final BoardRepository boardRepository;
    private final LabelMapper labelMapper;
    private final BoardAccessService boardAccessService;

    public List<LabelResponse> getLabels(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardMemberOrAdmin(userId, orgRole, boardId);
        return labelRepository.findAllByBoard_Id(boardId).stream()
                .map(labelMapper::toResponse)
                .toList();
    }

    @Transactional
    public LabelResponse createLabel(UUID userId, String orgRole, UUID orgId, UUID boardId, CreateLabelRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));

        Label label = Label.builder()
                .board(board)
                .orgId(orgId)
                .name(request.name())
                .color(request.color())
                .description(request.description())
                .build();

        return labelMapper.toResponse(labelRepository.save(label));
    }

    @Transactional
    public LabelResponse updateLabel(UUID userId, String orgRole, UUID boardId, UUID labelId, UpdateLabelRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        Label label = labelRepository.findByBoard_IdAndId(boardId, labelId)
                .orElseThrow(() -> new LabelNotFoundException("Label not found: " + labelId));

        if (request.name() != null && !request.name().isBlank()) label.setName(request.name());
        if (request.color() != null) label.setColor(request.color());
        if (request.description() != null) label.setDescription(request.description());

        return labelMapper.toResponse(labelRepository.save(label));
    }

    @Transactional
    public void deleteLabel(UUID userId, String orgRole, UUID boardId, UUID labelId) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        Label label = labelRepository.findByBoard_IdAndId(boardId, labelId)
                .orElseThrow(() -> new LabelNotFoundException("Label not found: " + labelId));
        labelRepository.delete(label);
    }
}
