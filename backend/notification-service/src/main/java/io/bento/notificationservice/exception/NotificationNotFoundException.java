package io.bento.notificationservice.exception;

public class NotificationNotFoundException extends RuntimeException {
    public NotificationNotFoundException(String id) {
        super("Notification not found: " + id);
    }
}
