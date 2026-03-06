package io.bento.apigateway.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaleTokenService {

    // TTL matches the refresh token lifetime (7 days). After that the refresh token itself
    // expires and the stale marker is no longer relevant.
    private static final Duration STALE_TTL = Duration.ofDays(7);

    private final ReactiveStringRedisTemplate redisTemplate;

    /**
     * Mark a user's org context as stale. Stores the current epoch second so the
     * filter can compare it against the JWT's iat claim.
     */
    public void markStale(UUID userId, UUID orgId) {
        String key = staleKey(userId, orgId);
        String staleSince = String.valueOf(Instant.now().getEpochSecond());
        redisTemplate.opsForValue()
                .set(key, staleSince, STALE_TTL)
                .block();
    }

    /**
     * Returns the epoch second at which the stale event occurred, or empty if the
     * token is not marked stale.
     */
    public Mono<Instant> getStaleSince(String userId, String orgId) {
        return redisTemplate.opsForValue()
                .get(staleKey(userId, orgId))
                .map(epochSeconds -> Instant.ofEpochSecond(Long.parseLong(epochSeconds)));
    }

    private String staleKey(UUID userId, UUID orgId) {
        return staleKey(userId.toString(), orgId.toString());
    }

    private String staleKey(String userId, String orgId) {
        return "stale:" + userId + ":" + orgId;
    }
}
