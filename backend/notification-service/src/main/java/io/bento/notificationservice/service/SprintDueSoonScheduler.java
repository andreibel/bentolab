package io.bento.notificationservice.service;

import io.bento.notificationservice.client.TaskServiceClient;
import io.bento.notificationservice.dto.response.SprintEndingSoonDto;
import io.bento.notificationservice.enums.NotificationType;
import io.bento.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SprintDueSoonScheduler {

    private final TaskServiceClient taskServiceClient;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void checkSprintsDueSoon() {
        log.debug("Checking sprints due soon...");
        List<SprintEndingSoonDto> sprints = taskServiceClient.getSprintsEndingSoon(24);
        if (sprints.isEmpty()) return;

        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);

        for (SprintEndingSoonDto sprint : sprints) {
            for (String memberId : sprint.memberIds()) {
                boolean alreadySent = notificationRepository
                        .existsBySprintIdAndUserIdAndTypeAndCreatedAtAfter(
                                sprint.sprintId(), memberId, NotificationType.SPRINT_DUE_SOON, since);
                if (!alreadySent) {
                    notificationService.createSprintDueSoonNotification(sprint, memberId);
                }
            }
        }
    }
}
