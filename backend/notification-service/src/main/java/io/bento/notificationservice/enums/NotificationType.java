package io.bento.notificationservice.enums;

public enum NotificationType {
    // Auth
    EMAIL_VERIFICATION,
    PASSWORD_RESET,
    // Org
    ORG_INVITATION,
    ORG_MEMBER_JOINED,
    // Board
    BOARD_MEMBER_ADDED,
    BOARD_MEMBER_REMOVED,
    // Issue
    ISSUE_ASSIGNED,
    ISSUE_COMMENTED,
    // Sprint
    SPRINT_STARTED,
    SPRINT_COMPLETED
}
