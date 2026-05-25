---
title: Roles & Permissions
description: Organization roles in Bento and what each role can do.
outline: [2, 3]
---

# Roles & Permissions

Every member of a Bento organization has one of four roles. Roles control what actions a member can take across all boards and settings in the organization.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Change member roles | ✅ | ✅ (not OWNER) | ❌ | ❌ |

## Steps

To change a member's role:

1. Navigate to **Settings → Members**.
2. Find the member in the list.
3. Open the role dropdown on their row.
4. Select the new role. The change takes effect immediately — the member's active session token is invalidated and they will receive a new token with the updated role on their next request.

<!-- SCREENSHOT: images/role-dropdown.png — role dropdown open on Bob's row -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/role-dropdown.png — role dropdown open on Bob's row -->

## Role matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create board | ✅ | ✅ | ❌ | ❌ |
| Edit board settings | ✅ | ✅ | ❌ | ❌ |
| Delete board | ✅ | ✅ | ❌ | ❌ |
| Manage labels | ✅ | ✅ | ✅ | ❌ |
| Create / edit issue | ✅ | ✅ | ✅ | ❌ |
| Comment on issue | ✅ | ✅ | ✅ | ❌ |
| Plan / start / close sprint | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Change member role | ✅ | ✅ (can't touch OWNER) | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |

## Troubleshooting

- **Can't change an OWNER's role** — Only the OWNER can transfer ownership or step down. ADMINs cannot touch OWNER-role members.
- **Role change not reflected immediately** — The member may need to refresh their session (the app does this automatically on the next API call). If the issue persists, the member can log out and log back in.
