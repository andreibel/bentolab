package io.bento.realtimeservice.event;

import io.bento.kafka.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class IssueEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final SimpMessagingTemplate messaging;

    @KafkaListener(topics = "bento.issue.events", groupId = "realtime-service")
    public void onIssueEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode typeNode = node.get("eventType");
            if (typeNode == null) return;

            switch (typeNode.asText()) {
                case "IssueStatusChangedEvent" -> {
                    IssueStatusChangedEvent e = kafkaObjectMapper.treeToValue(node, IssueStatusChangedEvent.class);
                    // Notify all viewers of the board — issue moved to a new column
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/issues", node);
                }
                case "IssueAssignedEvent" -> {
                    IssueAssignedEvent e = kafkaObjectMapper.treeToValue(node, IssueAssignedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/issues", node);
                    // Alert the assignee to refetch their notifications
                    if (e.assigneeId() != null && !e.assigneeId().equals(e.assignedByUserId())) {
                        messaging.convertAndSendToUser(e.assigneeId(), "/queue/notifications", node);
                    }
                }
                case "IssueCommentedEvent" -> {
                    IssueCommentedEvent e = kafkaObjectMapper.treeToValue(node, IssueCommentedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/issues", node);
                    // Alert assignee and watchers (skip the author)
                    if (e.assigneeId() != null && !e.assigneeId().equals(e.authorUserId())) {
                        messaging.convertAndSendToUser(e.assigneeId(), "/queue/notifications", node);
                    }
                    if (e.watcherIds() != null) {
                        e.watcherIds().stream()
                                .filter(id -> !id.equals(e.authorUserId()) && !id.equals(e.assigneeId()))
                                .forEach(id -> messaging.convertAndSendToUser(id, "/queue/notifications", node));
                    }
                }
                case "IssueClosedEvent" -> {
                    IssueClosedEvent e = kafkaObjectMapper.treeToValue(node, IssueClosedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/issues", node);
                    if (e.assigneeId() != null && !e.assigneeId().equals(e.closedByUserId())) {
                        messaging.convertAndSendToUser(e.assigneeId(), "/queue/notifications", node);
                    }
                }
                case "IssuePriorityChangedEvent" -> {
                    IssuePriorityChangedEvent e = kafkaObjectMapper.treeToValue(node, IssuePriorityChangedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/issues", node);
                    boolean escalated = "CRITICAL".equals(e.newPriority()) || "HIGH".equals(e.newPriority());
                    if (escalated && e.assigneeId() != null && !e.assigneeId().equals(e.changedByUserId())) {
                        messaging.convertAndSendToUser(e.assigneeId(), "/queue/notifications", node);
                    }
                }
                default -> log.debug("Unhandled issue event: {}", typeNode.asText());
            }
        } catch (Exception e) {
            log.error("Failed to process issue event: {}", payload, e);
        }
    }
}
