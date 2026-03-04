package io.bento.orgservice.repository;

import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgInvitationRepository extends JpaRepository<OrgInvitation, UUID> {
    boolean existsByOrganization_IdAndEmailAndStatus(UUID orgId, String email, Status status);
    List<OrgInvitation> findAllByOrganization_Id(UUID orgId);
    List<OrgInvitation> findAllByOrganization_IdAndStatus(UUID orgId, Status status);

    Optional<OrgInvitation> findByIdAndOrganization_Id(UUID id, UUID orgId);

    Optional<OrgInvitation> findByEmailAndToken(String email, String token);

}