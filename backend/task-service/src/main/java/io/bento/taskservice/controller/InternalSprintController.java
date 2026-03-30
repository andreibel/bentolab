package io.bento.taskservice.controller;

import io.bento.taskservice.client.BoardServiceClient;
import io.bento.taskservice.dto.response.SprintEndingSoonDto;
import io.bento.taskservice.enums.SprintStatus;
import io.bento.taskservice.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/internal/sprints")
@RequiredArgsConstructor
public class InternalSprintController {

    private final SprintRepository sprintRepository;
    private final BoardServiceClient boardServiceClient;

    @GetMapping("/ending-soon")
    public ResponseEntity<List<SprintEndingSoonDto>> getSprintsEndingSoon(
            @RequestParam(defaultValue = "24") int withinHours) {

        Instant now    = Instant.now();
        Instant cutoff = now.plus(withinHours, ChronoUnit.HOURS);

        List<SprintEndingSoonDto> result = sprintRepository
                .findAllByStatusAndEndDateBetween(SprintStatus.ACTIVE, now, cutoff)
                .stream()
                .map(sprint -> new SprintEndingSoonDto(
                        sprint.getId(),
                        sprint.getBoardId(),
                        sprint.getOrgId(),
                        sprint.getName(),
                        sprint.getEndDate() != null ? sprint.getEndDate().toString() : null,
                        boardServiceClient.getBoardMemberIds(sprint.getBoardId())
                ))
                .toList();

        return ResponseEntity.ok(result);
    }
}
