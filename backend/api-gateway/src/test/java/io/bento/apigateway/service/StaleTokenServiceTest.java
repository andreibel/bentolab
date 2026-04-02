package io.bento.apigateway.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaleTokenServiceTest {

    @Mock
    ReactiveStringRedisTemplate redisTemplate;

    @Mock
    ReactiveValueOperations<String, String> valueOps;

    StaleTokenService service;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        service = new StaleTokenService(redisTemplate);
    }

    @Test
    void markStale_writesCorrectKeyWithSevenDayTtl() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        when(valueOps.set(anyString(), anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        service.markStale(userId, orgId);

        String expectedKey = "stale:" + userId + ":" + orgId;
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> valueCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(valueOps).set(keyCaptor.capture(), valueCaptor.capture(), ttlCaptor.capture());

        assertThat(keyCaptor.getValue()).isEqualTo(expectedKey);
        assertThat(ttlCaptor.getValue()).isEqualTo(Duration.ofDays(7));
        // value should be parseable as a long epoch second
        assertThat(Long.parseLong(valueCaptor.getValue())).isPositive();
    }

    @Test
    void getStaleSince_whenKeyExists_returnsInstant() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        long epochSeconds = Instant.now().getEpochSecond();
        when(valueOps.get("stale:" + userId + ":" + orgId))
                .thenReturn(Mono.just(String.valueOf(epochSeconds)));

        StepVerifier.create(service.getStaleSince(userId, orgId))
                .expectNext(Instant.ofEpochSecond(epochSeconds))
                .verifyComplete();
    }

    @Test
    void getStaleSince_whenKeyAbsent_returnsEmpty() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        when(valueOps.get("stale:" + userId + ":" + orgId)).thenReturn(Mono.empty());

        StepVerifier.create(service.getStaleSince(userId, orgId))
                .verifyComplete();
    }
}
