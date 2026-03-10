package io.bento.orgservice.repository;

import io.bento.orgservice.entity.OrgPermission;
import io.bento.orgservice.enums.OrgPermissionKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgPermissionRepository extends JpaRepository<OrgPermission, UUID> {

    List<OrgPermission> findAllByOrgId(UUID orgId);

    Optional<OrgPermission> findByOrgIdAndPermissionKey(UUID orgId, OrgPermissionKey permissionKey);

    boolean existsByOrgId(UUID orgId);
}