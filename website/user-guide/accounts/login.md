---
title: Login
description: How to log in to your Bento account.
outline: [2, 3]
---

# Login

Log in with your email and password. Bento uses short-lived JWT access tokens refreshed automatically in the background — you stay logged in without manual re-authentication unless your session is explicitly invalidated.

## Who can do this

Anyone with a verified Bento account.

## Steps

1. Navigate to `/login` on your Bento instance.
2. Enter your email address and password.
3. Click the primary action button to submit.
4. On success, you are redirected to your organization's default view. If you belong to multiple organizations, you are shown the last one you visited.

<!-- SCREENSHOT: images/login-form.png — login form, email filled, password masked -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/login-form.png — login form, email filled, password masked -->

## Session & device

- Your session is tied to the device and browser you log in from. Each login creates an independent refresh token.
- Sessions remain active until you log out explicitly, the refresh token expires, or an administrator removes you from the organization.
- If an admin removes you or changes your role, your current session token is invalidated server-side (stale-token detection). You will receive a 401 response and be prompted to log back in.
- You can view and revoke active sessions from **Settings → Security**.

## Troubleshooting

- **"Invalid credentials"** — Check that your email and password are correct. Passwords are case-sensitive.
- **"Email not verified"** — You registered but did not click the verification link. Check your inbox or request a new link. See [Verify Email](./verify-email.md).
- **Account locked** — <!-- TODO: confirm with maintainer — whether account lockout after failed attempts is implemented -->
- **Forgot your password?** — Use the [Forgot Password](./forgot-password.md) flow to reset it.
