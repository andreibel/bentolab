---
title: Email (SMTP)
description: Configure SMTP for transactional email in Bento — verification, password reset, and invitations.
outline: [2, 3]
---

# Email (SMTP)

Bento sends transactional email for three purposes: email address verification on registration, password reset links, and organization invitation links. All three go through the notification service.

## Providers

Any SMTP provider works. Common choices for self-hosters:

| Provider | Notes |
|---|---|
| **Brevo (Sendinblue)** | Free tier: 300 emails/day. Good deliverability. |
| **Mailgun** | Free tier: 100 emails/day for 3 months. |
| **Amazon SES** | Very cheap at scale. Requires a verified domain. |
| **Postfix / self-hosted MTA** | Full control. Higher deliverability effort. |
| **MailHog** | Dev only — captures email in a web UI, does not deliver. |

## Configuration

Set these variables in your `.env` file:

```bash
MAIL_FROM=noreply@example.com
```

Additional SMTP connection variables are configured inside the notification service. If you are customizing the compose file, add the following to the `notification-service` environment block:

```yaml
SPRING_MAIL_HOST: smtp.example.com
SPRING_MAIL_PORT: 587
SPRING_MAIL_USERNAME: your-smtp-user
SPRING_MAIL_PASSWORD: your-smtp-password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH: "true"
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE: "true"
```

<!-- TODO: confirm with maintainer — exact env var names for SMTP host/port/user/password -->

::: info Default (MailHog)
The default `docker-compose.beta.yml` routes all email through MailHog. No SMTP credentials are needed. View captured email at `http://localhost:8025`.
:::

## Testing with MailHog

MailHog is included in the default compose file and starts automatically. To verify email is flowing:

1. Register a new account at the app URL.
2. Open `http://localhost:8025` in your browser.
3. The verification email should appear in the MailHog inbox within seconds.
4. Click the verification link — it should take you back to the app.

If the email does not appear, check the notification service logs:

```bash
docker compose -f docker-compose.beta.yml logs notification-service
```

## Troubleshooting

**Email not arriving in MailHog** — Confirm MailHog is running (`docker compose ps`). Check that `MAIL_FROM` is set and the notification service started without errors.

**Authentication failure** — Double-check the SMTP credentials. Many providers require an app password rather than your account password.

**TLS / port issues** — Port 587 with STARTTLS is the standard. Port 465 (SSL) and port 25 (plaintext, often blocked by ISPs) are alternatives. Match the port and TLS setting to your provider's documentation.

**Emails delivered to spam** — Configure SPF, DKIM, and DMARC DNS records for your sending domain. Most providers have a guide for this.
