package io.bento.orgservice.repository;

import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrgInvitationRepository extends JpaRepository<OrgInvitation, UUID> {
    boolean existsByOrganization_IdAndEmailAndStatus(UUID orgId, String email, Status status);
}