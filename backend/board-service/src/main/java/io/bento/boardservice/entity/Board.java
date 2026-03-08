package io.bento.boardservice.entity;

import io.bento.boardservice.enums.BoardType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "boards",
    uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "board_key"})
)
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;


    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "board_key", nullable = false, length = 10)
    private String boardKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", nullable = false)
    @Builder.Default
    private BoardType boardType = BoardType.SCRUM;

    @Column(name = "background", length = 100)
    private String background;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "issue_counter", nullable = false)
    @Builder.Default
    private Integer issueCounter = 0;

    @Column(name = "created_at",nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(nullable = false,  name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

}