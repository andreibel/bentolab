package io.bento.boardservice.entity;

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
        name = "board_columns",
        uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "name"})
)
public class BoardColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id" , nullable = false)
    private Board board;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "color", length = 7)
    private String color ;

    @Column(name = "wip_limit")
    private Integer wipLimit;

    @Column(name = "is_initial", nullable = false)
    @Builder.Default
    private Boolean isInitial = false;

    @Column(name = "is_final", nullable = false)
    @Builder.Default
    private Boolean isFinal = false;

    @Column(name = "created_at",nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

}