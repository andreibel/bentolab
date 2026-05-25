---
title: Comments & Mentions
description: How to comment on issues and mention teammates in Bento.
outline: [2, 3]
---

# Comments & Mentions

Comments on an issue let your team discuss work, provide updates, and ask questions. Mentions notify specific members and create a notification in their inbox.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Comment on issue | ✅ | ✅ | ✅ | ❌ |

## Steps

1. Open the issue detail view.
2. Scroll to the **Comments** tab (or the comments section at the bottom of the detail panel).
3. Click the comment input field.
4. Type your comment. Markdown is supported — bold, italic, code blocks, and lists.
5. Press Enter (or click the submit button) to post. The comment appears immediately for all viewers via the realtime connection.
6. To edit or delete your own comment, hover over it and use the actions menu.

<!-- SCREENSHOT: images/issue-comments.png — comments tab on ACME-42 with 3 comments -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/mention-autocomplete.png — @a typed in comment box, autocomplete showing 2 users -->

## Mentions

To mention a team member in a comment:

1. Type `@` followed by the member's name.
2. An autocomplete dropdown appears with matching members.
3. Click a member from the list or press Tab/Enter to select.
4. The mention is inserted as `@name`. When you post the comment, the mentioned member receives an in-app notification in their Inbox and optionally an email notification.

You can mention multiple people in a single comment.

## Troubleshooting

- **Comment not posting** — Check your internet connection. Comments require an active connection. If the realtime connection is lost, the UI shows an indicator — wait for reconnection and try again.
- **Mention autocomplete not appearing** — Confirm you typed `@` with no space before the name. The autocomplete triggers immediately after `@`.
- **Mentioned member not notified** — In-app notifications require the notification service to be running. Check its logs if notifications are not appearing.
