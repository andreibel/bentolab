---
title: Forgot Password
description: How to reset your Bento password using the forgot-password flow.
outline: [2, 3]
---

# Forgot Password

If you cannot log in, you can request a password reset link by email. The link is valid for one hour and is single-use. After resetting, all your existing sessions are revoked.

## Who can do this

Anyone with a registered Bento account (no login required).

## Steps

1. Navigate to `/forgot-password` (or click "Forgot password?" on the login page).
2. Enter your email address and click the primary action button.
3. If the email matches a registered account, Bento sends a password reset link. For security, the page shows a generic success message regardless of whether the email exists.
4. Open the email and click the reset link. For local development, find the email in MailHog at `http://localhost:8025`.
5. On the reset page, enter your new password (minimum 8 characters) and confirm it.
6. Click the primary action button to save the new password.
7. All existing sessions are revoked. Log in with your new password.

<!-- SCREENSHOT: images/forgot-password-form.png — forgot-password email entry -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/reset-password-form.png — reset-password with two valid fields -->

## Troubleshooting

- **Reset email not arriving** — Check your spam folder. For local development, check MailHog. The app does not reveal whether the email exists in the system, so no error is shown for unregistered addresses.
- **"Link expired"** — The one-hour window passed. Return to the forgot-password page and request a new link.
- **"Link already used"** — Each reset link is single-use. Request a new one if needed.
- **Password not accepted** — Bento requires at least 8 characters. Check for copy-paste whitespace.
