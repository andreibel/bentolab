package io.bento.realtimeservice.event;

import io.bento.kafka.event.MemberJoinedEvent;
import io.bento.kafka.event.MemberRemovedEvent;
import io.bento.kafka.event.MemberRoleChangedEvent;
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
public class OrgEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final SimpMessagingTemplate messaging;

    @KafkaListener(topics = "bento.org.events", groupId = "realtime-service")
    public void onOrgEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode typeNode = node.get("eventType");
            if (typeNode == null) return;

            switch (typeNode.asText()) {
                case "MemberJoinedEvent" -> {
                    MemberJoinedEvent e = kafkaObjectMapper.treeToValue(node, MemberJoinedEvent.class);
                    // Notify all org members that the member list changed
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/members", node);
                }
                case "MEMBER_REMOVED" -> {
                    MemberRemovedEvent e = kafkaObjectMapper.treeToValue(node, MemberRemovedEvent.class);
                    // Notify remaining members that the list changed
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/members", node);
                    // Tell the removed user directly so the frontend can redirect them out
                    messaging.convertAndSendToUser(e.userId().toString(), "/queue/notifications", node);
                }
                case "MEMBER_ROLE_CHANGED" -> {
                    MemberRoleChangedEvent e = kafkaObjectMapper.treeToValue(node, MemberRoleChangedEvent.class);
                    // Notify org members that a role changed
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/members", node);
                    // Tell the affected user directly so their UI can re-evaluate permissions
                    messaging.convertAndSendToUser(e.userId().toString(), "/queue/notifications", node);
                }
                default -> log.debug("Unhandled org event: {}", typeNode.asText());
            }
        } catch (Exception e) {
            log.error("Failed to process org event: {}", payload, e);
        }
    }
}
