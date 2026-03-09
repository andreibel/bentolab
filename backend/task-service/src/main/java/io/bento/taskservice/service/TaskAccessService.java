package io.bento.taskservice.service;

import io.bento.taskservice.exception.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class TaskAccessService {

    public void requireOrgMember(String orgRole) {
        if (orgRole == null) {
            throw new AccessDeniedException("Organization membership required");
        }
    }

    public void requireOrgAdmin(String orgRole) {
        if (!isOrgAdmin(orgRole)) {
            throw new AccessDeniedException("Organization admin role required");
        }
    }

    // userId = the requesting user, ownerId = the resource owner (reporter/author/assignee)
    public void requireSelfOrAdmin(String userId, String ownerId, String orgRole) {
        if (!userId.equals(ownerId) && !isOrgAdmin(orgRole)) {
            throw new AccessDeniedException("You do not have permission to modify this resource");
        }
    }

    public boolean isOrgAdmin(String orgRole) {
        return "ORG_ADMIN".equals(orgRole) || "ORG_OWNER".equals(orgRole);
    }
}
