package io.bento.orgservice.repository;

import io.bento.orgservice.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    boolean existsBySlug(String slug);
    @Query("SELECT o FROM Organization o JOIN OrganizationMember m ON m.organization = o WHERE m.userId = :userId")
    List<Organization> findAllByMemberUserId(@Param("userId") UUID userId);
    Optional<Organization> findBySlug(String slug);
}