---
title: Members Settings
description: How to manage organization members from the settings page in Bento.
outline: [2, 3]
---

# Members Settings

The members settings page is the central place to view all organization members, invite new ones, change roles, and remove members.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| View members | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ (not OWNER) | ❌ | ❌ |
| Remove members | ✅ | ✅ (not OWNER) | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Members** (at `/settings/members`).
2. The members list shows all current members and pending invitations with their roles.
3. To invite: click "Invite" and see [Invite Members](../organizations/invite-members.md).
4. To change a role: open the role dropdown on a member's row and select a new role.
5. To remove a member: open the actions menu on their row and select remove. The member loses access immediately and their active session is invalidated.

<!-- SCREENSHOT: images/settings-members.png — members list, 4 rows, mix of roles -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/settings-members.png — members list, 4 rows, mix of roles -->

## Troubleshooting

- **Can't remove a member** — ADMIN cannot remove or change the OWNER. OWNER must transfer ownership before being removable.
- **Removed member still has access** — Session invalidation happens server-side on the next request. If the member has an active tab open, they will be logged out on their next API call.
