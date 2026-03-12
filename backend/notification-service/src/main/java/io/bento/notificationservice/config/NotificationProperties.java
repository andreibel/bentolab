package io.bento.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notification")
public record NotificationProperties(Mail mail, Discord discord) {

    public record Mail(String from, String fromName, String frontendUrl) {}
    public record Discord(boolean enabled) {}
}
