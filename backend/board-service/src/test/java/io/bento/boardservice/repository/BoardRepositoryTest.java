package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Board;
import io.bento.boardservice.enums.BoardType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class BoardRepositoryTest {

    @Autowired
    private BoardRepository boardRepository;

    private final UUID ORG_A = UUID.randomUUID();
    private final UUID ORG_B = UUID.randomUUID();
    private final UUID OWNER = UUID.randomUUID();

    private Board buildBoard(UUID orgId, String name, String boardKey) {
        return Board.builder()
                .orgId(orgId)
                .name(name)
                .boardKey(boardKey)
                .boardType(BoardType.SCRUM)
                .ownerId(OWNER)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsBoardWithGeneratedId() {
        Board saved = boardRepository.save(buildBoard(ORG_A, "My Board", "MB"));

        assertThat(saved.getId()).isNotNull();
        assertThat(boardRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void save_setsDefaultValues() {
        Board saved = boardRepository.save(buildBoard(ORG_A, "Defaults Board", "DB"));

        assertThat(saved.getBoardType()).isEqualTo(BoardType.SCRUM);
        assertThat(saved.getIsArchived()).isFalse();
        assertThat(saved.getIssueCounter()).isEqualTo(0);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void delete_removesBoard() {
        Board saved = boardRepository.save(buildBoard(ORG_A, "To Delete", "TD"));

        boardRepository.deleteById(saved.getId());

        assertThat(boardRepository.findById(saved.getId())).isEmpty();
    }

    // =========================================================================
    // findAllByOrgId
    // =========================================================================

    @Test
    void findAllByOrgId_returnsOnlyBoardsForThatOrg() {
        boardRepository.save(buildBoard(ORG_A, "Board A1", "A1"));
        boardRepository.save(buildBoard(ORG_A, "Board A2", "A2"));
        boardRepository.save(buildBoard(ORG_B, "Board B1", "B1"));

        List<Board> result = boardRepository.findAllByOrgId(ORG_A);

        assertThat(result).hasSize(2)
                .allMatch(b -> b.getOrgId().equals(ORG_A));
    }

    @Test
    void findAllByOrgId_unknownOrg_returnsEmptyList() {
        boardRepository.save(buildBoard(ORG_A, "Board A", "AA"));

        assertThat(boardRepository.findAllByOrgId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findAllByOrgId_noBoards_returnsEmptyList() {
        assertThat(boardRepository.findAllByOrgId(ORG_A)).isEmpty();
    }

    // =========================================================================
    // existsByOrgIdAndBoardKey
    // =========================================================================

    @Test
    void existsByOrgIdAndBoardKey_existingKey_returnsTrue() {
        boardRepository.save(buildBoard(ORG_A, "Alpha Board", "ALPHA"));

        assertThat(boardRepository.existsByOrgIdAndBoardKey(ORG_A, "ALPHA")).isTrue();
    }

    @Test
    void existsByOrgIdAndBoardKey_unknownKey_returnsFalse() {
        boardRepository.save(buildBoard(ORG_A, "Alpha Board", "ALPHA"));

        assertThat(boardRepository.existsByOrgIdAndBoardKey(ORG_A, "BETA")).isFalse();
    }

    @Test
    void existsByOrgIdAndBoardKey_sameKeyDifferentOrg_returnsFalse() {
        boardRepository.save(buildBoard(ORG_A, "Shared Key Board", "SHARED"));

        // Same key but different org — should not match
        assertThat(boardRepository.existsByOrgIdAndBoardKey(ORG_B, "SHARED")).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateOrgIdAndBoardKey_throwsDataIntegrityViolation() {
        boardRepository.save(buildBoard(ORG_A, "First", "DUP"));

        assertThatThrownBy(() -> boardRepository.saveAndFlush(buildBoard(ORG_A, "Second", "DUP")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_sameBoardKeyDifferentOrg_succeeds() {
        boardRepository.save(buildBoard(ORG_A, "Board A", "SAME"));
        Board saved = boardRepository.saveAndFlush(buildBoard(ORG_B, "Board B", "SAME"));

        assertThat(saved.getId()).isNotNull();
    }
}
