package io.bento.orgservice.event;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class OrgEventPublisher {
    private static final String ORG_EVENTS_TOPIC = "bento.org.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishInvitationCreated(InvitationCreatedEvent event) {
        kafkaTemplate.send(ORG_EVENTS_TOPIC,event.orgId().toString(),event);
    }

    public void publishMemberJoined(MemberJoinedEvent event) {
        kafkaTemplate.send(ORG_EVENTS_TOPIC, event.orgId().toString(), event);
    }



}
