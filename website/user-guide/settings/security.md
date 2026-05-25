---
title: Security Settings
description: How to change your password and manage active sessions in Bento.
outline: [2, 3]
---

# Security Settings

The security settings page lets you change your password and view (and revoke) your active login sessions.

## Who can do this

Any authenticated member (your own account only).

## Steps

**Change password:**

1. Navigate to **Settings → Security** (at `/settings/security`).
2. Find the "Change password" section.
3. Enter your current password and the new password (twice to confirm).
4. Click "Save". All active sessions except the current one are revoked.

**Revoke a session:**

1. In the "Active sessions" section, find the session you want to end.
2. Click the revoke action on that row. The session token is invalidated immediately.

<!-- SCREENSHOT: images/settings-security.png — security page (sessions list + password section) -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/change-password-form.png — change-password form, all fields valid -->

## Troubleshooting

- **"Current password incorrect"** — The password you entered does not match. Use [Forgot Password](../accounts/forgot-password.md) if you cannot remember your current password.
- **Sessions list not loading** — <!-- TODO: confirm with maintainer — whether session listing is implemented in beta -->
