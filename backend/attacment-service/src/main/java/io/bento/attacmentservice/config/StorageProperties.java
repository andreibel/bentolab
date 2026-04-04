package io.bento.attacmentservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint,
        String publicEndpoint,
        String bucketName,
        String region,
        String accessKey,
        String secretKey,
        boolean pathStyleAccess,
        int uploadUrlExpiryMinutes,
        int downloadUrlExpiryMinutes,
        List<String> corsOrigins
) {
    public StorageProperties {
        if (uploadUrlExpiryMinutes <= 0) uploadUrlExpiryMinutes = 10;
        if (downloadUrlExpiryMinutes <= 0) downloadUrlExpiryMinutes = 60;
        if (corsOrigins == null || corsOrigins.isEmpty()) corsOrigins = List.of("*");
    }
}
