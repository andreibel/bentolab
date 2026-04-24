package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.enums.BoardType;
import org.junit.jupiter.api.BeforeEach;
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
class BoardMemberRepositoryTest {

    @Autowired
    private BoardMemberRepository memberRepository;

    @Autowired
    private BoardRepository boardRepository;

    private Board boardA;
    private Board boardB;
    private final UUID USER_1 = UUID.randomUUID();
    private final UUID USER_2 = UUID.randomUUID();
    private final UUID ADDER  = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        boardA = boardRepository.save(Board.builder()
                .orgId(UUID.randomUUID())
                .name("Board A")
                .boardKey("BA")
                .boardType(BoardType.SCRUM)
                .ownerId(UUID.randomUUID())
                .build());

        boardB = boardRepository.save(Board.builder()
                .orgId(UUID.randomUUID())
                .name("Board B")
                .boardKey("BB")
                .boardType(BoardType.KANBAN)
                .ownerId(UUID.randomUUID())
                .build());
    }

    private BoardMember buildMember(Board board, UUID userId, BoardRole role) {
        return BoardMember.builder()
                .board(board)
                .userId(userId)
                .boardRole(role)
                .addedBy(ADDER)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsMemberWithGeneratedId() {
        BoardMember saved = memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(saved.getId()).isNotNull();
        assertThat(memberRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void save_setsDefaultValues() {
        BoardMember saved = memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(saved.getJoinedAt()).isNotNull();
    }

    // =========================================================================
    // findAllByBoard_Id
    // =========================================================================

    @Test
    void findAllByBoardId_returnsMembersForThatBoard() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));
        memberRepository.save(buildMember(boardA, USER_2, BoardRole.SCRUM_MASTER));
        memberRepository.save(buildMember(boardB, USER_1, BoardRole.VIEWER));

        List<BoardMember> result = memberRepository.findAllByBoard_Id(boardA.getId());

        assertThat(result).hasSize(2)
                .allMatch(m -> m.getBoard().getId().equals(boardA.getId()));
    }

    @Test
    void findAllByBoardId_unknownBoard_returnsEmptyList() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.findAllByBoard_Id(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findAllByBoardId_noMembers_returnsEmptyList() {
        assertThat(memberRepository.findAllByBoard_Id(boardA.getId())).isEmpty();
    }

    // =========================================================================
    // findAllByUserId
    // =========================================================================

    @Test
    void findAllByUserId_returnsMembershipsAcrossBoards() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));
        memberRepository.save(buildMember(boardB, USER_1, BoardRole.VIEWER));
        memberRepository.save(buildMember(boardA, USER_2, BoardRole.SCRUM_MASTER));

        List<BoardMember> result = memberRepository.findAllByUserId(USER_1);

        assertThat(result).hasSize(2)
                .allMatch(m -> m.getUserId().equals(USER_1));
    }

    @Test
    void findAllByUserId_unknownUser_returnsEmptyList() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.findAllByUserId(UUID.randomUUID())).isEmpty();
    }

    // =========================================================================
    // findByBoard_IdAndUserId
    // =========================================================================

    @Test
    void findByBoardIdAndUserId_existingMember_returnsMember() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.PRODUCT_OWNER));

        assertThat(memberRepository.findByBoard_IdAndUserId(boardA.getId(), USER_1))
                .isPresent()
                .get()
                .extracting(BoardMember::getBoardRole)
                .isEqualTo(BoardRole.PRODUCT_OWNER);
    }

    @Test
    void findByBoardIdAndUserId_wrongBoard_returnsEmpty() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.findByBoard_IdAndUserId(boardB.getId(), USER_1)).isEmpty();
    }

    @Test
    void findByBoardIdAndUserId_unknownUser_returnsEmpty() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.findByBoard_IdAndUserId(boardA.getId(), UUID.randomUUID())).isEmpty();
    }

    // =========================================================================
    // existsByBoard_IdAndUserId
    // =========================================================================

    @Test
    void existsByBoardIdAndUserId_existingMember_returnsTrue() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.existsByBoard_IdAndUserId(boardA.getId(), USER_1)).isTrue();
    }

    @Test
    void existsByBoardIdAndUserId_unknownUser_returnsFalse() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.existsByBoard_IdAndUserId(boardA.getId(), UUID.randomUUID())).isFalse();
    }

    @Test
    void existsByBoardIdAndUserId_wrongBoard_returnsFalse() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThat(memberRepository.existsByBoard_IdAndUserId(boardB.getId(), USER_1)).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateBoardIdAndUserId_throwsDataIntegrityViolation() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));

        assertThatThrownBy(() -> memberRepository.saveAndFlush(buildMember(boardA, USER_1, BoardRole.VIEWER)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_sameUserDifferentBoard_succeeds() {
        memberRepository.save(buildMember(boardA, USER_1, BoardRole.DEVELOPER));
        BoardMember saved = memberRepository.saveAndFlush(buildMember(boardB, USER_1, BoardRole.VIEWER));

        assertThat(saved.getId()).isNotNull();
    }
}
