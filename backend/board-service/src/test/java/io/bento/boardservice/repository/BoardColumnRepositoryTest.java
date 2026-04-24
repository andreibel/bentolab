package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardColumn;
import io.bento.boardservice.enums.BoardType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class BoardColumnRepositoryTest {

    @Autowired
    private BoardColumnRepository columnRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private EntityManager em;

    private Board savedBoard;
    private Board otherBoard;

    @BeforeEach
    void setUp() {
        savedBoard = boardRepository.save(Board.builder()
                .orgId(UUID.randomUUID())
                .name("Test Board")
                .boardKey("TB")
                .boardType(BoardType.SCRUM)
                .ownerId(UUID.randomUUID())
                .build());

        otherBoard = boardRepository.save(Board.builder()
                .orgId(UUID.randomUUID())
                .name("Other Board")
                .boardKey("OB")
                .boardType(BoardType.KANBAN)
                .ownerId(UUID.randomUUID())
                .build());
    }

    private BoardColumn buildColumn(Board board, String name, int position) {
        return BoardColumn.builder()
                .board(board)
                .name(name)
                .position(position)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsColumnWithGeneratedId() {
        BoardColumn saved = columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(saved.getId()).isNotNull();
        assertThat(columnRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void save_setsDefaultValues() {
        BoardColumn saved = columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(saved.getIsInitial()).isFalse();
        assertThat(saved.getIsFinal()).isFalse();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getWipLimit()).isNull();
        assertThat(saved.getColor()).isNull();
    }

    // =========================================================================
    // findAllByBoard_IdOrderByPosition
    // =========================================================================

    @Test
    void findAllByBoardIdOrderByPosition_returnsColumnsInPositionOrder() {
        columnRepository.save(buildColumn(savedBoard, "Done", 2));
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));
        columnRepository.save(buildColumn(savedBoard, "In Progress", 1));

        List<BoardColumn> result = columnRepository.findAllByBoard_IdOrderByPosition(savedBoard.getId());

        assertThat(result).hasSize(3)
                .extracting(BoardColumn::getPosition)
                .containsExactly(0, 1, 2);
    }

    @Test
    void findAllByBoardIdOrderByPosition_excludesOtherBoardColumns() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));
        columnRepository.save(buildColumn(otherBoard, "Backlog", 0));

        List<BoardColumn> result = columnRepository.findAllByBoard_IdOrderByPosition(savedBoard.getId());

        assertThat(result).hasSize(1)
                .allMatch(c -> c.getBoard().getId().equals(savedBoard.getId()));
    }

    @Test
    void findAllByBoardIdOrderByPosition_noColumns_returnsEmptyList() {
        assertThat(columnRepository.findAllByBoard_IdOrderByPosition(savedBoard.getId())).isEmpty();
    }

    @Test
    void findAllByBoardIdOrderByPosition_unknownBoardId_returnsEmptyList() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.findAllByBoard_IdOrderByPosition(UUID.randomUUID())).isEmpty();
    }

    // =========================================================================
    // findByBoard_IdAndId
    // =========================================================================

    @Test
    void findByBoardIdAndId_existingColumn_returnsColumn() {
        BoardColumn saved = columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        Optional<BoardColumn> result = columnRepository.findByBoard_IdAndId(savedBoard.getId(), saved.getId());

        assertThat(result).isPresent()
                .get()
                .extracting(BoardColumn::getName)
                .isEqualTo("To Do");
    }

    @Test
    void findByBoardIdAndId_wrongBoardId_returnsEmpty() {
        BoardColumn saved = columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.findByBoard_IdAndId(otherBoard.getId(), saved.getId())).isEmpty();
    }

    @Test
    void findByBoardIdAndId_unknownColumnId_returnsEmpty() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.findByBoard_IdAndId(savedBoard.getId(), UUID.randomUUID())).isEmpty();
    }

    // =========================================================================
    // existsByBoard_IdAndName
    // =========================================================================

    @Test
    void existsByBoardIdAndName_existingName_returnsTrue() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.existsByBoard_IdAndName(savedBoard.getId(), "To Do")).isTrue();
    }

    @Test
    void existsByBoardIdAndName_unknownName_returnsFalse() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.existsByBoard_IdAndName(savedBoard.getId(), "Done")).isFalse();
    }

    @Test
    void existsByBoardIdAndName_sameNameDifferentBoard_returnsFalse() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));

        assertThat(columnRepository.existsByBoard_IdAndName(otherBoard.getId(), "To Do")).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateBoardIdAndName_throwsDataIntegrityViolation() {
        columnRepository.save(buildColumn(savedBoard, "Duplicate", 0));

        assertThatThrownBy(() -> columnRepository.saveAndFlush(buildColumn(savedBoard, "Duplicate", 1)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_sameNameDifferentBoard_succeeds() {
        columnRepository.save(buildColumn(savedBoard, "To Do", 0));
        BoardColumn saved = columnRepository.saveAndFlush(buildColumn(otherBoard, "To Do", 0));

        assertThat(saved.getId()).isNotNull();
    }
}
