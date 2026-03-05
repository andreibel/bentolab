package io.bento.orgservice.repository;

import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findAllByUserId(UUID userId);

    Optional<OrganizationMember> findAllByOrganization_IdAndUserId(UUID organizationId, UUID userId);

    boolean existsByOrganization_IdAndUserId(UUID organizationId, UUID userId);

    List<OrganizationMember> findAllByOrganization_Id(UUID id);

    @Query("SELECT m.orgRole FROM OrganizationMember m WHERE m.organization.id = :orgId AND m.userId = :userId")
    Optional<OrgRoles> findRoleByOrgIdAndUserId(@Param("orgId") UUID orgId, @Param("userId") UUID userId);
}