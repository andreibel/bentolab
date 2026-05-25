---
title: Register
description: How to create a new Bento account.
outline: [2, 3]
---

# Register

Creating an account is the first step to using Bento. Registration is open to anyone with an email address — no invitation required to create an account. To join an existing organization, you will need an invitation link from an organization admin after registering.

## Who can do this

Anyone (no account required).

## Steps

1. Navigate to `/register` on your Bento instance.
2. Enter your full name, email address, and a password (minimum 8 characters).
3. Click the primary action button to submit the form.
4. Bento creates your account and sends a verification email to the address you provided.
5. You are redirected to the "Check your email" page — see [Verify Email](./verify-email.md) for next steps.

<!-- SCREENSHOT: images/register-form.png — register page, all fields valid -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/register-success.png — "Check your email" page post-register -->

## Troubleshooting

- **"Email already in use"** — An account with that email already exists. Use [Forgot Password](./forgot-password.md) if you cannot log in.
- **Password rejected** — Bento requires at least 8 characters. Check for leading or trailing spaces.
- **Verification email not arriving** — Check your spam folder. If the instance is in development mode, open MailHog at `http://localhost:8025` to find the email. See [Verify Email](./verify-email.md#resending-the-email) to request a new link.
- **Form submit button unresponsive** — All fields must be filled and the email must be valid. Check the error messages beneath each field.
