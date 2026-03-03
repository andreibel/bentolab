package io.bento.orgservice.repository;

import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findAllByUserId(UUID userId);

    Optional<OrganizationMember> findAllByOrganization_IdAndUserId(UUID organizationId, UUID userId);

    boolean existsByOrganization_IdAndUserId(UUID organizationId, UUID userId);

    List<OrganizationMember> findAllByOrganization_Id(UUID id);
}