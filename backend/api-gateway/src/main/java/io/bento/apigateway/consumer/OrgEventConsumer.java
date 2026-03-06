package io.bento.apigateway.consumer;

import tools.jackson.databind.ObjectMapper;
import io.bento.apigateway.event.OrgMemberStaleEvent;
import io.bento.apigateway.service.StaleTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrgEventConsumer {

    private static final Set<String> STALE_EVENT_TYPES = Set.of("MEMBER_REMOVED", "MEMBER_ROLE_CHANGED");

    private final StaleTokenService staleTokenService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "bento.org.events", groupId = "api-gateway")
    public void onOrgEvent(String payload) {
        try {
            OrgMemberStaleEvent event = objectMapper.readValue(payload, OrgMemberStaleEvent.class);
            log.info("[OrgEventConsumer] received event: type={} orgId={} userId={}", event.eventType(), event.orgId(), event.userId());

            if (event.eventType() == null || !STALE_EVENT_TYPES.contains(event.eventType())) {
                log.info("[OrgEventConsumer] ignoring event type={}", event.eventType());
                return;
            }
            if (event.userId() == null || event.orgId() == null) {
                log.warn("[OrgEventConsumer] missing userId or orgId for event type={}", event.eventType());
                return;
            }

            staleTokenService.markStale(event.userId(), event.orgId());
            log.info("[OrgEventConsumer] stale key written for userId={} orgId={}", event.userId(), event.orgId());

        } catch (Exception e) {
            log.error("[OrgEventConsumer] failed to process event payload: {}", payload, e);
        }
    }
}
