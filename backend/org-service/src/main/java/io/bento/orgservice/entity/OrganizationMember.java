package io.bento.orgservice.entity;

import io.bento.orgservice.enums.OrgRoles;
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
    name = "organization_member",
    uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "user_id"}),
    indexes = {
        @Index(name = "idx_org_member_org_id", columnList = "org_id"),
        @Index(name = "idx_org_member_user_id", columnList = "user_id")
    }
)
public class OrganizationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "org_role", nullable = false, length = 20)
    private OrgRoles orgRole;

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();
}