---
title: Verify Email
description: How to verify your email address after registering for Bento.
outline: [2, 3]
---

# Verify Email

After registering, Bento sends a verification email to the address you provided. You must click the link in that email before you can log in. The link is valid for 24 hours.

## Who can do this

Anyone who has just registered (no login required).

## Steps

1. After registering, you are redirected to the "Check your email" page.
2. Open the email from Bento in your inbox. If running locally, open MailHog at `http://localhost:8025`.
3. Click the verification link in the email.
4. You are redirected to the app and shown a success message.
5. Log in with your email and password.

<!-- SCREENSHOT: images/verify-email-sent.png — CheckEmailPage with user's email masked -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/verify-email-success.png — VerifyEmailPage with success confirmation -->

## Resending the email

If the verification link has expired or you did not receive the email:

1. Navigate to `/register` and attempt to log in — the app will prompt you to resend if your email is unverified.
2. Alternatively, navigate directly to the resend page (accessible from the "Check your email" page) and enter your email address.
3. Bento sends a new verification link. The old link is invalidated.

## Troubleshooting

- **"Link expired"** — The 24-hour window passed. Request a new link using the resend option above.
- **"Link already used"** — Each link is single-use. If you clicked it before and are seeing this now, your email may already be verified — try logging in.
- **Email not in inbox** — Check your spam folder. For local development, all email goes to MailHog at `http://localhost:8025`, not to a real inbox.
