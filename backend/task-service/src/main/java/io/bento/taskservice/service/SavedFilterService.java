package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateSavedFilterRequest;
import io.bento.taskservice.entity.SavedFilter;
import io.bento.taskservice.exception.SavedFilterNotFoundException;
import io.bento.taskservice.repository.SavedFilterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedFilterService {

    private final SavedFilterRepository savedFilterRepository;

    public List<SavedFilter> getFilters(String orgId, String boardId, String userId) {
        List<SavedFilter> own = savedFilterRepository.findAllByOrgIdAndBoardIdAndUserId(orgId, boardId, userId);
        List<SavedFilter> shared = savedFilterRepository.findAllByOrgIdAndBoardIdAndIsSharedTrue(orgId, boardId);

        // Merge: own filters + shared filters not already in own
        List<SavedFilter> result = new ArrayList<>(own);
        shared.stream()
                .filter(f -> !f.getUserId().equals(userId))
                .forEach(result::add);
        return result;
    }

    public SavedFilter createFilter(String orgId, String userId, CreateSavedFilterRequest request) {
        SavedFilter filter = SavedFilter.builder()
                .orgId(orgId)
                .boardId(request.boardId())
                .userId(userId)
                .name(request.name())
                .isShared(request.isShared())
                .filters(request.filters())
                .createdAt(Instant.now())
                .build();

        return savedFilterRepository.save(filter);
    }

    public void deleteFilter(String orgId, String userId, String orgRole, String filterId) {
        SavedFilter filter = savedFilterRepository.findByOrgIdAndId(orgId, filterId)
                .orElseThrow(() -> new SavedFilterNotFoundException(filterId));

        // Only owner or admin can delete
        boolean isAdmin = "ORG_ADMIN".equals(orgRole) || "ORG_OWNER".equals(orgRole);
        if (!filter.getUserId().equals(userId) && !isAdmin) {
            throw new io.bento.taskservice.exception.AccessDeniedException("You cannot delete this filter");
        }

        savedFilterRepository.delete(filter);
    }
}
