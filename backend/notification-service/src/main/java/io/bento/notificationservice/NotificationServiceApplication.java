package io.bento.notificationservice;

import io.bento.notificationservice.config.GatewayAuthProperties;
import io.bento.notificationservice.config.NotificationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({GatewayAuthProperties.class, NotificationProperties.class})
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
