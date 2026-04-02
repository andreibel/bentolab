package io.bento.apigateway.consumer;

import io.bento.apigateway.service.StaleTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrgEventConsumerTest {

    @Mock
    StaleTokenService staleTokenService;

    OrgEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new OrgEventConsumer(staleTokenService, new ObjectMapper());
    }

    @Test
    void memberRemovedEvent_callsMarkStale() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String payload = """
                {"eventType":"MEMBER_REMOVED","orgId":"%s","userId":"%s"}
                """.formatted(orgId, userId);

        consumer.onOrgEvent(payload);

        verify(staleTokenService).markStale(userId, orgId);
    }

    @Test
    void memberRoleChangedEvent_callsMarkStale() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String payload = """
                {"eventType":"MEMBER_ROLE_CHANGED","orgId":"%s","userId":"%s","newRole":"MEMBER"}
                """.formatted(orgId, userId);

        consumer.onOrgEvent(payload);

        verify(staleTokenService).markStale(userId, orgId);
    }

    @Test
    void unknownEventType_doesNotCallMarkStale() {
        String payload = """
                {"eventType":"MEMBER_JOINED","orgId":"%s","userId":"%s"}
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        consumer.onOrgEvent(payload);

        verify(staleTokenService, never()).markStale(any(), any());
    }

    @Test
    void nullEventType_doesNotCallMarkStale() {
        String payload = """
                {"orgId":"%s","userId":"%s"}
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        consumer.onOrgEvent(payload);

        verify(staleTokenService, never()).markStale(any(), any());
    }

    @Test
    void missingUserId_doesNotCallMarkStale() {
        String payload = """
                {"eventType":"MEMBER_REMOVED","orgId":"%s"}
                """.formatted(UUID.randomUUID());

        consumer.onOrgEvent(payload);

        verify(staleTokenService, never()).markStale(any(), any());
    }

    @Test
    void missingOrgId_doesNotCallMarkStale() {
        String payload = """
                {"eventType":"MEMBER_REMOVED","userId":"%s"}
                """.formatted(UUID.randomUUID());

        consumer.onOrgEvent(payload);

        verify(staleTokenService, never()).markStale(any(), any());
    }

    @Test
    void malformedJson_doesNotThrow() {
        // Should be swallowed by the catch block
        consumer.onOrgEvent("not-valid-json{{{");

        verify(staleTokenService, never()).markStale(any(), any());
    }
}
