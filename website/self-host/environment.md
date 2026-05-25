---
title: Environment Variables
description: Complete reference for every environment variable used by Bento's Docker Compose deployment.
outline: [2, 3]
---

# Environment Variables

All configuration is done through environment variables in your `.env` file. Copy `.env.example` to `.env` and fill in every value before starting the stack.

## Security secrets

These three values must be unique random strings. Generate each one with:

```bash
openssl rand -base64 32
```

| Name | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | yes | — | Signs and verifies all JWT access tokens. Changing this value invalidates all active sessions. |
| `GATEWAY_INTERNAL_SECRET` | yes | — | Shared secret between the API gateway and every microservice. The gateway adds this as `X-Internal-Secret` header; services reject requests without it. |
| `AUTH_PEPPER` | yes | — | Extra entropy mixed into password hashes before bcrypt. Changing this prevents existing passwords from verifying. |

## Database credentials

| Name | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_USER` | yes | — | Username for all three PostgreSQL instances (auth, org, board). |
| `POSTGRES_PASSWORD` | yes | — | Password for all three PostgreSQL instances. |
| `MONGO_USERNAME` | yes | — | MongoDB root username. |
| `MONGO_PASSWORD` | yes | — | MongoDB root password. |
| `MINIO_ROOT_USER` | yes | — | MinIO root access key. |
| `MINIO_ROOT_PASSWORD` | yes | — | MinIO root secret key. |

## URLs

| Name | Required | Default | Description |
|---|---|---|---|
| `FRONTEND_URL` | yes | — | Public URL where users reach the app (e.g. `https://bento.example.com`). Used in email links for verification and password reset. |

## Mail

| Name | Required | Default | Description |
|---|---|---|---|
| `MAIL_FROM` | yes | — | From address on all transactional emails (e.g. `noreply@example.com`). |

::: info MailHog (development)
In the default compose file, email is captured by MailHog at `http://localhost:8025`. No additional mail configuration is needed for local development. See [Email (SMTP)](./email.md) to switch to a real provider.
:::

## MinIO / attachments

| Name | Required | Default | Description |
|---|---|---|---|
| `MINIO_ROOT_USER` | yes | — | MinIO root access key (also used by attachment-service to connect). |
| `MINIO_ROOT_PASSWORD` | yes | — | MinIO root secret key. |

## Optional integrations

| Name | Required | Default | Description |
|---|---|---|---|
| `DISCORD_ENABLED` | no | `false` | Set to `true` to enable Discord webhook notifications from the notification service. |
| `FRONTEND_PORT` | no | `3000` | Host port mapped to the frontend container. |
| `MAILHOG_UI_PORT` | no | `8025` | Host port for the MailHog web UI. |
