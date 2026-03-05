package io.bento.orgservice.entity;

import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
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
    name = "org_invitation",
    indexes = {
        @Index(name = "idx_org_invitation_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_org_invitation_email_status", columnList = "email, status"),
        @Index(name = "idx_org_invitation_expires_at", columnList = "expires_at")
    }
)
public class OrgInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne( optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "org_role", nullable = false, length = 20)
    private OrgRoles orgRole;

    @Column(name = "token", nullable = false, unique = true, length = 200)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "invited_by", nullable = false)
    private UUID invitedBy;

    @Column(name = "message" ,columnDefinition = "TEXT")
    private String message;

    @Column(name = "expires_at", nullable = false)
    @Builder.Default
    private Instant expiresAt = Instant.now().plusSeconds(7 * 24 * 60 * 60); // Default to 7 days

    @Column(name = "created_at",nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

}