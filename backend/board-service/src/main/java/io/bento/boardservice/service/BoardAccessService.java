package io.bento.boardservice.service;

import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.repository.BoardMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardAccessService {

    private final BoardMemberRepository boardMemberRepository;

    public Optional<BoardRole> getBoardRole(UUID userId, UUID boardId) {
        return boardMemberRepository.findByBoard_IdAndUserId(boardId, userId)
                .map(m -> m.getBoardRole());
    }

    public boolean isOrgAdmin(String orgRole) {
        return "ORG_ADMIN".equals(orgRole) || "ORG_OWNER".equals(orgRole);
    }

    public boolean isOrgOwner(String orgRole) {
        return "ORG_OWNER".equals(orgRole);
    }

    /** Any board member OR org admin+ */
    public void requireBoardMemberOrAdmin(UUID userId, String orgRole, UUID boardId) {
        if (isOrgAdmin(orgRole)) return;
        if (boardMemberRepository.existsByBoard_IdAndUserId(boardId, userId)) return;
        throw new BoardAccessDeniedException("Access denied: not a board member");
    }

    /** Board member with one of the allowed roles OR org admin+ */
    public void requireBoardRoleOrAdmin(UUID userId, String orgRole, UUID boardId, BoardRole... allowedRoles) {
        if (isOrgAdmin(orgRole)) return;
        BoardRole role = getBoardRole(userId, boardId)
                .orElseThrow(() -> new BoardAccessDeniedException("Access denied: not a board member"));
        if (Arrays.asList(allowedRoles).contains(role)) return;
        throw new BoardAccessDeniedException("Access denied: insufficient board role");
    }

    /** Board PRODUCT_OWNER OR org owner only (for delete/destructive ops) */
    public void requireBoardOwnerOrOrgOwner(UUID userId, String orgRole, UUID boardId) {
        if (isOrgOwner(orgRole)) return;
        BoardRole role = getBoardRole(userId, boardId)
                .orElseThrow(() -> new BoardAccessDeniedException("Access denied: not a board member"));
        if (BoardRole.PRODUCT_OWNER == role) return;
        throw new BoardAccessDeniedException("Access denied: insufficient board role");
    }
}
