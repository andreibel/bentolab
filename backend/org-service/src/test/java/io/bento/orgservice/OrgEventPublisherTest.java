package io.bento.orgservice;

import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.MemberJoinedEvent;
import io.bento.kafka.event.MemberRemovedEvent;
import io.bento.kafka.event.MemberRoleChangedEvent;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.event.OrgEventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrgEventPublisherTest {

    private static final String TOPIC = "bento.org.events";
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private OrgEventPublisher orgEventPublisher;

    @Test
    void publishInvitationCreated_sendsToOrgEventsTopic() {
        InvitationCreatedEvent event = new InvitationCreatedEvent(
                ORG_ID, "Acme Corp", USER_ID,
                "newuser@example.com", OrgRoles.ORG_MEMBER.name(),
                UUID.randomUUID().toString(),
                Instant.now().plusSeconds(86400).toString());

        orgEventPublisher.publishInvitationCreated(event);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), anyString(), any());
        assertThat(topicCaptor.getValue()).isEqualTo(TOPIC);
    }

    @Test
    void publishInvitationCreated_usesOrgIdAsKey() {
        InvitationCreatedEvent event = new InvitationCreatedEvent(
                ORG_ID, "Acme Corp", USER_ID,
                "newuser@example.com", OrgRoles.ORG_MEMBER.name(),
                UUID.randomUUID().toString(),
                Instant.now().plusSeconds(86400).toString());

        orgEventPublisher.publishInvitationCreated(event);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(anyString(), keyCaptor.capture(), any());
        assertThat(keyCaptor.getValue()).isEqualTo(ORG_ID.toString());
    }

    @Test
    void publishMemberJoined_sendsToOrgEventsTopic() {
        MemberJoinedEvent event = new MemberJoinedEvent(
                ORG_ID, "Acme Corp", USER_ID,
                OrgRoles.ORG_MEMBER.name(), Instant.now().toString());

        orgEventPublisher.publishMemberJoined(event);

        verify(kafkaTemplate).send(TOPIC, ORG_ID.toString(), event);
    }

    @Test
    void publishMemberRemoved_sendsToOrgEventsTopic() {
        MemberRemovedEvent event = new MemberRemovedEvent(ORG_ID, USER_ID);

        orgEventPublisher.publishMemberRemoved(event);

        verify(kafkaTemplate).send(TOPIC, ORG_ID.toString(), event);
    }

    @Test
    void publishMemberRoleChanged_sendsToOrgEventsTopic() {
        MemberRoleChangedEvent event = new MemberRoleChangedEvent(ORG_ID, USER_ID, OrgRoles.ORG_ADMIN.name());

        orgEventPublisher.publishMemberRoleChanged(event);

        verify(kafkaTemplate).send(TOPIC, ORG_ID.toString(), event);
    }
}
