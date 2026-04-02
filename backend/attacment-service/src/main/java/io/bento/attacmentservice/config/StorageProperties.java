package io.bento.attacmentservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint,
        String bucketName,
        String region,
        String accessKey,
        String secretKey,
        boolean pathStyleAccess,
        int uploadUrlExpiryMinutes,
        int downloadUrlExpiryMinutes
) {
    public StorageProperties {
        if (uploadUrlExpiryMinutes <= 0) uploadUrlExpiryMinutes = 10;
        if (downloadUrlExpiryMinutes <= 0) downloadUrlExpiryMinutes = 60;
    }
}
