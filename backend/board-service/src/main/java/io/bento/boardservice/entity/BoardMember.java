package io.bento.boardservice.entity;

import io.bento.boardservice.enums.BoardRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(
        name = "board_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"})
)
public class BoardMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(optional = false, fetch =  FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_role", nullable = false)
    private BoardRole boardRole;

    @Column(name = "joined_at",nullable = false, updatable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();

    @Column(name = "added_by")
    private UUID addedBy;

}