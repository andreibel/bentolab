---
title: Invite Members
description: How to invite people to your Bento organization.
outline: [2, 3]
---

# Invite Members

You invite people to an organization by email. They receive a link to accept the invitation and create an account (or log in if they already have one). Invited people appear as pending members until they accept.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Revoke invitations | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Members**.
2. Click "Invite" to open the invite dialog.
3. Enter one or more email addresses (one per line or comma-separated).
4. Select the role to assign to the invited members (MEMBER by default).
5. Click "Invite". Bento sends an invitation email to each address.

<!-- SCREENSHOT: images/members-page.png — members list, 4 rows, mix of roles -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/invite-modal.png — invite dialog with 2 emails entered, role = MEMBER -->
<!-- SCREENSHOT: images/invite-email-preview.png — MailHog rendering of the invite email -->

## Revoking an invite

Pending invitations appear in the members list with a "Pending" badge.

1. Find the pending member in the members list.
2. Open the actions menu on their row.
3. Select the option to revoke the invitation. The invitation link is immediately invalidated.

## Troubleshooting

- **Invite email not received** — Check spam. For local dev, check MailHog at `http://localhost:8025`. Confirm `FRONTEND_URL` is set correctly so the link in the email resolves to your Bento instance.
- **"Already a member"** — The email address is already associated with an active member of this organization. No invite is needed.
- **Invite link expired** — Invitation links expire after <!-- TODO: confirm with maintainer — invite expiry period -->. Ask an admin to resend the invitation.
