package io.bento.orgservice;

import io.bento.orgservice.enums.OrgRoles;
import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.MemberJoinedEvent;
import io.bento.orgservice.event.OrgEventPublisher;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrgEventPublisherTest {

    private static final String TOPIC = "bento.org.events";
    private static final String BROKERS = "localhost:9092";

    private OrgEventPublisher orgEventPublisher;
    private KafkaConsumer<String, Object> consumer;

    @BeforeEach
    void setUp() {
        Map<String, Object> producerProps = new HashMap<>();
        producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, BROKERS);
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JacksonJsonSerializer.class);
        KafkaTemplate<String, Object> template = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerProps));
        orgEventPublisher = new OrgEventPublisher(template);

        Map<String, Object> consumerProps = new HashMap<>();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, BROKERS);
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "test-group-" + UUID.randomUUID());
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JacksonJsonDeserializer.class);
        consumerProps.put(JacksonJsonDeserializer.TRUSTED_PACKAGES, "*");
        consumer = new KafkaConsumer<>(consumerProps);
        consumer.subscribe(List.of(TOPIC));

        // Wait until partition is actually assigned before the test publishes,
        // otherwise the message lands before the consumer gets its offset position.
        long timeout = System.currentTimeMillis() + 10_000;
        while (consumer.assignment().isEmpty() && System.currentTimeMillis() < timeout) {
            consumer.poll(Duration.ofMillis(200));
        }
    }

    @AfterEach
    void tearDown() {
        consumer.close();
    }

    @Test
    void shouldPublishInvitationCreatedEvent() {
        UUID orgId = UUID.randomUUID();
        InvitationCreatedEvent event = new InvitationCreatedEvent(
                orgId,
                "Acme Corp",
                UUID.randomUUID(),
                "newuser@example.com",
                OrgRoles.ORG_MEMBER.name(),
                UUID.randomUUID().toString(),
                Instant.now().plusSeconds(7 * 24 * 60 * 60).toString()
        );

        orgEventPublisher.publishInvitationCreated(event);

        ConsumerRecord<String, Object> received = pollUntilReceived(orgId.toString());
        assertThat(received).isNotNull();
        System.out.println("[Kafka] InvitationCreatedEvent on topic=" + received.topic()
                + " partition=" + received.partition()
                + " offset=" + received.offset()
                + "\n  value=" + received.value());
    }

    @Test
    void shouldPublishMemberJoinedEvent() {
        UUID orgId = UUID.randomUUID();
        MemberJoinedEvent event = new MemberJoinedEvent(
                orgId,
                "Acme Corp",
                UUID.randomUUID(),
                OrgRoles.ORG_MEMBER.name(),
                Instant.now().toString()
        );

        orgEventPublisher.publishMemberJoined(event);

        ConsumerRecord<String, Object> received = pollUntilReceived(orgId.toString());
        assertThat(received).isNotNull();
        System.out.println("[Kafka] MemberJoinedEvent on topic=" + received.topic()
                + " partition=" + received.partition()
                + " offset=" + received.offset()
                + "\n  value=" + received.value());
    }

    private ConsumerRecord<String, Object> pollUntilReceived(String expectedKey) {
        long deadline = System.currentTimeMillis() + 5_000;
        while (System.currentTimeMillis() < deadline) {
            for (ConsumerRecord<String, Object> record : consumer.poll(Duration.ofMillis(500))) {
                if (expectedKey.equals(record.key())) return record;
            }
        }
        return null;
    }
}