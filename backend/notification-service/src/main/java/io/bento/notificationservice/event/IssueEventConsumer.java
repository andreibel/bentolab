package io.bento.notificationservice.event;

import io.bento.kafka.event.IssueAssignedEvent;
import io.bento.kafka.event.IssueClosedEvent;
import io.bento.kafka.event.IssueCommentedEvent;
import io.bento.kafka.event.IssuePriorityChangedEvent;
import io.bento.kafka.event.IssueStatusChangedEvent;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import io.bento.notificationservice.service.EmailService;
import io.bento.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class IssueEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.issue.events", groupId = "notification-service")
    public void onIssueEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asText();

            switch (eventType) {
                case "IssueAssignedEvent" -> {
                    IssueAssignedEvent e = kafkaObjectMapper.treeToValue(node, IssueAssignedEvent.class);
                    notificationService.createIssueAssignedNotification(e);
                    emailService.sendIssueAssigned(e);
                }
                case "IssueCommentedEvent" -> {
                    IssueCommentedEvent e = kafkaObjectMapper.treeToValue(node, IssueCommentedEvent.class);
                    List<String> watcherIds = e.watcherIds() != null ? e.watcherIds() : Collections.emptyList();
                    List<String> mentionedUserIds = e.mentionedUserIds() != null ? e.mentionedUserIds() : Collections.emptyList();

                    // Notify assignee (ISSUE_COMMENTED)
                    if (e.assigneeId() != null && !e.assigneeId().equals(e.authorUserId())) {
                        notificationService.createIssueCommentedNotification(e, e.assigneeId());
                    }
                    // Notify watchers (ISSUE_COMMENTED), skip author and assignee
                    for (String watcherId : watcherIds) {
                        if (!watcherId.equals(e.authorUserId()) && !watcherId.equals(e.assigneeId())) {
                            notificationService.createIssueCommentedNotification(e, watcherId);
                        }
                    }
                    // Notify mentioned users (ISSUE_MENTIONED), skip author
                    for (String mentionedId : mentionedUserIds) {
                        if (!mentionedId.equals(e.authorUserId())) {
                            notificationService.createIssueMentionedNotification(e, mentionedId);
                            emailService.sendIssueMentioned(e, mentionedId);
                        }
                    }
                }
                case "IssueStatusChangedEvent" -> {
                    IssueStatusChangedEvent e = kafkaObjectMapper.treeToValue(node, IssueStatusChangedEvent.class);
                    List<String> watcherIds = e.watcherIds() != null ? e.watcherIds() : Collections.emptyList();
                    Set<String> recipients = new HashSet<>();
                    if (e.assigneeId() != null) recipients.add(e.assigneeId());
                    if (e.reporterId() != null) recipients.add(e.reporterId());
                    recipients.addAll(watcherIds);
                    recipients.remove(e.changedByUserId()); // don't notify the actor
                    for (String userId : recipients) {
                        notificationService.createIssueStatusChangedNotification(e, userId);
                    }
                }
                case "IssueClosedEvent" -> {
                    IssueClosedEvent e = kafkaObjectMapper.treeToValue(node, IssueClosedEvent.class);
                    Set<String> recipients = new HashSet<>();
                    if (e.assigneeId() != null) recipients.add(e.assigneeId());
                    if (e.reporterId() != null) recipients.add(e.reporterId());
                    recipients.remove(e.closedByUserId());
                    for (String userId : recipients) {
                        notificationService.createIssueClosedNotification(e, userId);
                    }
                }
                case "IssuePriorityChangedEvent" -> {
                    IssuePriorityChangedEvent e = kafkaObjectMapper.treeToValue(node, IssuePriorityChangedEvent.class);
                    boolean escalated = "CRITICAL".equals(e.newPriority()) || "HIGH".equals(e.newPriority());
                    if (escalated && e.assigneeId() != null && !e.assigneeId().equals(e.changedByUserId())) {
                        notificationService.createIssuePriorityChangedNotification(e);
                        emailService.sendIssuePriorityEscalated(e);
                    }
                }
                default -> log.debug("Unhandled issue event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process issue event: {}", payload, e);
        }
    }
}
