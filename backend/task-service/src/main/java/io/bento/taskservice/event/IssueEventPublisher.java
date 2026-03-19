package io.bento.taskservice.event;

import io.bento.kafka.event.IssueAssignedEvent;
import io.bento.kafka.event.IssueClosedEvent;
import io.bento.kafka.event.IssueCommentedEvent;
import io.bento.kafka.event.IssuePriorityChangedEvent;
import io.bento.kafka.event.IssueStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class IssueEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(IssueEventPublisher.class);
    private static final String ISSUE_EVENTS_TOPIC = "bento.issue.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishIssueAssigned(IssueAssignedEvent event) {
        send(event.issueId(), event);
    }

    public void publishIssueCommented(IssueCommentedEvent event) {
        send(event.issueId(), event);
    }

    public void publishIssueStatusChanged(IssueStatusChangedEvent event) {
        send(event.issueId(), event);
    }

    public void publishIssueClosed(IssueClosedEvent event) {
        send(event.issueId(), event);
    }

    public void publishIssuePriorityChanged(IssuePriorityChangedEvent event) {
        send(event.issueId(), event);
    }

    private void send(String key, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(ISSUE_EVENTS_TOPIC, key, payload);
        } catch (Exception e) {
            log.warn("Failed to publish event {}: {}", event.getClass().getSimpleName(), e.getMessage());
        }
    }
}
