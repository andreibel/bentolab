---
title: Inbox
description: How to use the Bento inbox to view and manage in-app notifications.
outline: [2, 3]
---

# Inbox

The inbox collects all in-app notifications in one place. Notifications are generated when issues are assigned to you, you are mentioned in a comment, a dependency is blocked, or a sprint closes.

## Who can do this

All organization members.

## Steps

1. Click **Inbox** in the left sidebar (or navigate to `/inbox`). A badge shows the count of unread notifications.
2. Notifications are listed in reverse chronological order, newest first.
3. Click a notification to open the related issue or event.
4. Mark notifications as read individually by clicking the mark-read control, or use the "Mark all read" button.
5. Use the filter controls to show only unread notifications or notifications of a specific type.

<!-- SCREENSHOT: images/inbox-page.png — inbox with 4 unread, 3 read notifications -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/inbox-notification-row.png — hover state on one notification row -->

## Notification types

| Type | Trigger |
|---|---|
| **Mention** | Someone mentioned you (`@yourname`) in a comment |
| **Assignment** | An issue was assigned to you |
| **Dependency blocked** | An issue you are assigned to is blocked by another issue |
| **Sprint closed** | A sprint you participated in was closed |
| **Invitation** | You were invited to an organization |

## Troubleshooting

- **Notifications not appearing** — The notification service must be running. Check its container status and logs.
- **Badge count not updating** — The inbox badge updates via the realtime connection. If the realtime service is unavailable, refresh the page to force a count update.
