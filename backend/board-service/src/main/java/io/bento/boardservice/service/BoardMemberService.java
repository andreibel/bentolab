package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.AddBoardMemberRequest;
import io.bento.boardservice.dto.request.UpdateBoardMemberRoleRequest;
import io.bento.boardservice.dto.response.BoardMemberResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.event.BoardEventPublisher;
import io.bento.boardservice.event.BoardMemberAddedEvent;
import io.bento.boardservice.event.BoardMemberRemovedEvent;
import io.bento.boardservice.exception.BoardMemberAlreadyExistsException;
import io.bento.boardservice.exception.BoardMemberNotFoundException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardMemberMapper;
import io.bento.boardservice.repository.BoardMemberRepository;
import io.bento.boardservice.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardMemberService {

    private final BoardMemberRepository boardMemberRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberMapper boardMemberMapper;
    private final BoardAccessService boardAccessService;
    private final BoardEventPublisher boardEventPublisher;

    public List<BoardMemberResponse> getMembers(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardMemberOrAdmin(userId, orgRole, boardId);
        return boardMemberRepository.findAllByBoard_Id(boardId).stream()
                .map(boardMemberMapper::toResponse)
                .toList();
    }

    @Transactional
    public BoardMemberResponse addMember(UUID userId, String orgRole, UUID boardId, AddBoardMemberRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));

        if (boardMemberRepository.existsByBoard_IdAndUserId(boardId, request.userId())) {
            throw new BoardMemberAlreadyExistsException("User is already a member of this board");
        }

        BoardMember member = BoardMember.builder()
                .board(board)
                .userId(request.userId())
                .boardRole(request.boardRole())
                .addedBy(userId)
                .build();

        BoardMemberResponse response = boardMemberMapper.toResponse(boardMemberRepository.save(member));
        boardEventPublisher.publishBoardMemberAdded(new BoardMemberAddedEvent(
                boardId, board.getName(), request.userId(), userId, request.boardRole()
        ));
        return response;
    }

    @Transactional
    public BoardMemberResponse updateMemberRole(UUID userId, String orgRole, UUID boardId, UUID targetUserId, UpdateBoardMemberRoleRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER);
        BoardMember member = boardMemberRepository.findByBoard_IdAndUserId(boardId, targetUserId)
                .orElseThrow(() -> new BoardMemberNotFoundException("Member not found for user: " + targetUserId));

        member.setBoardRole(request.boardRole());
        return boardMemberMapper.toResponse(boardMemberRepository.save(member));
    }

    @Transactional
    public void removeMember(UUID userId, String orgRole, UUID boardId, UUID targetUserId) {
        // self-leave is always allowed
        if (!userId.equals(targetUserId)) {
            boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER);
        }
        BoardMember member = boardMemberRepository.findByBoard_IdAndUserId(boardId, targetUserId)
                .orElseThrow(() -> new BoardMemberNotFoundException("Member not found for user: " + targetUserId));
        String boardName = member.getBoard().getName();
        boardMemberRepository.delete(member);
        boardEventPublisher.publishBoardMemberRemoved(new BoardMemberRemovedEvent(boardId, boardName, targetUserId));
    }
}
