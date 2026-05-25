---
title: Assign & Estimate
description: How to assign an issue to a team member and set story point estimates in Bento.
outline: [2, 3]
---

# Assign & Estimate

Assigning an issue tells your team who is responsible for it. Setting an estimate (in story points) lets the sprint planning and velocity features work correctly.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Assign / unassign | ✅ | ✅ | ✅ | ❌ |
| Set story points | ✅ | ✅ | ✅ | ❌ |

## Steps

**Assign a member:**

1. Open the issue detail view.
2. Find the **Assignee** field in the metadata panel.
3. Click the assignee field to open the member picker.
4. Search for a member by name and click to select.
5. To unassign, click the current assignee and select "Unassign" or clear the field.

The assigned member receives an in-app notification and (if configured) an email notification.

**Set story points:**

1. Open the issue detail view.
2. Find the **Story points** field in the metadata panel.
3. Click the field to open the story-point picker.
4. Select a value from the Fibonacci scale (1, 2, 3, 5, 8, 13, 21) or enter a custom number.
5. Click to confirm. The estimate is used in sprint capacity planning and velocity charts.

<!-- SCREENSHOT: images/issue-assignee-picker.png — assignee popover with 4 users -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/issue-estimate-picker.png — story-points picker (Fibonacci) -->

## Troubleshooting

- **Member not appearing in picker** — The member must be added to the board before they appear as an option. See [Board Permissions](../boards/permissions.md).
- **Story points not saving** — Confirm your role is MEMBER or higher.
- **Assigned member not notified** — Check that the notification service is running and that the member has an email address on their account. In-app notifications appear in the Inbox regardless of email configuration.
