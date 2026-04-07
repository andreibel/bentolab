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
        name = "labels",
        uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "name"})
)
public class Label {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "color", length = 7, nullable = false)
    private String color ;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "created_at",nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

}