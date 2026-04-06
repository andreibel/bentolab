package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateMilestoneRequest;
import io.bento.taskservice.dto.request.UpdateMilestoneRequest;
import io.bento.taskservice.dto.response.MilestoneResponse;
import io.bento.taskservice.entity.Milestone;
import io.bento.taskservice.enums.MilestoneStatus;
import io.bento.taskservice.exception.MilestoneNotFoundException;
import io.bento.taskservice.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private static final String DEFAULT_COLOR = "#f59e0b";

    private final MilestoneRepository milestoneRepository;
    private final TaskAccessService   taskAccessService;

    // ── List ─────────────────────────────────────────────────────────────────

    public List<MilestoneResponse> getMilestones(String orgId, String boardId) {
        return milestoneRepository.findAllByOrgIdAndBoardId(orgId, boardId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Get ──────────────────────────────────────────────────────────────────

    public MilestoneResponse getMilestone(String milestoneId, String orgId) {
        return toResponse(findOrThrow(milestoneId, orgId));
    }

    // ── Create ───────────────────────────────────────────────────────────────

    public MilestoneResponse createMilestone(String orgId, String userId, String orgRole,
                                              CreateMilestoneRequest req) {
        taskAccessService.requireOrgMember(orgRole);

        Milestone milestone = Milestone.builder()
                .orgId(orgId)
                .boardId(req.boardId())
                .title(req.title())
                .description(req.description())
                .date(req.date())
                .color(req.color() != null ? req.color() : DEFAULT_COLOR)
                .status(MilestoneStatus.PLANNED)
                .createdBy(userId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return toResponse(milestoneRepository.save(milestone));
    }

    // ── Update ───────────────────────────────────────────────────────────────

    public MilestoneResponse updateMilestone(String milestoneId, String orgId, String userId,
                                              String orgRole, UpdateMilestoneRequest req) {
        Milestone milestone = findOrThrow(milestoneId, orgId);
        taskAccessService.requireSelfOrAdmin(userId, milestone.getCreatedBy(), orgRole);

        if (req.title()       != null) milestone.setTitle(req.title());
        if (req.description() != null) milestone.setDescription(req.description());
        if (req.date()        != null) milestone.setDate(req.date());
        if (req.color()       != null) milestone.setColor(req.color());
        if (req.status()      != null) milestone.setStatus(req.status());

        milestone.setUpdatedAt(Instant.now());
        return toResponse(milestoneRepository.save(milestone));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public void deleteMilestone(String milestoneId, String orgId, String userId, String orgRole) {
        Milestone milestone = findOrThrow(milestoneId, orgId);
        taskAccessService.requireSelfOrAdmin(userId, milestone.getCreatedBy(), orgRole);
        milestoneRepository.deleteById(milestoneId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Milestone findOrThrow(String id, String orgId) {
        return milestoneRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new MilestoneNotFoundException(id));
    }

    private MilestoneResponse toResponse(Milestone m) {
        return new MilestoneResponse(
                m.getId(),
                m.getOrgId(),
                m.getBoardId(),
                m.getTitle(),
                m.getDescription(),
                m.getDate(),
                m.getColor(),
                m.getStatus(),
                m.getCreatedBy(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}