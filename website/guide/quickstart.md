---
title: Quickstart
description: Get a running Bento instance in 5 minutes using the beta Docker Compose file.
outline: [2, 3]
---

# Quickstart

This guide gets you from zero to a running Bento instance in about 5 minutes. You need Docker and Docker Compose — no build tools, no source code checkout.

## Prerequisites

- **Docker** 24+ with the Compose plugin (`docker compose version`)
- **4 GB RAM** available on the host (2.4 GB for the [minimal profile](../self-host/profiles.md))
- **Ports free**: 3000 (frontend), 8080 (gateway), 8025 (MailHog), 9001 (MinIO console)
- **Internet access** on first run to pull ~12 images from Docker Hub

::: tip ARM users
All images are published for both `linux/amd64` and `linux/arm64`. Bento runs natively on Apple Silicon and Raspberry Pi 4/5 with no emulation.
:::

## 1. Download the compose file

```bash
curl -O https://raw.githubusercontent.com/andreibel/bento/main/docker-compose.beta.yml
curl -O https://raw.githubusercontent.com/andreibel/bento/main/.env.example
```

<!-- SCREENSHOT: images/first-run-terminal.png — terminal showing docker compose up -d success + docker ps listing containers -->

## 2. Configure secrets

```bash
cp .env.example .env
```

Open `.env` and fill in every value. Generate the three security secrets with:

```bash
openssl rand -base64 32
```

Minimum required changes:

| Variable | What it is |
|---|---|
| `JWT_SECRET` | Signs all auth tokens — keep private |
| `GATEWAY_INTERNAL_SECRET` | Shared secret between gateway and services |
| `AUTH_PEPPER` | Extra entropy added to password hashes |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `MONGO_PASSWORD` | MongoDB password |
| `MINIO_ROOT_PASSWORD` | MinIO (file storage) password |
| `FRONTEND_URL` | Public URL users reach the app at — used in email links |
| `MAIL_FROM` | From address on verification and reset emails |

::: warning
Never commit `.env` to version control. It contains secrets.
:::

## 3. Start the stack

```bash
docker compose -f docker-compose.beta.yml up -d
```

Docker pulls ~12 images on the first run. Once all containers are healthy:

| URL | What it is |
|---|---|
| `http://localhost:3000` | The app |
| `http://localhost:8025` | MailHog — catches all outbound email in dev |
| `http://localhost:9001` | MinIO console — browse uploaded files |

Wait until all containers report `healthy`:

```bash
docker compose -f docker-compose.beta.yml ps
```

## 4. Create your first organization

Open the app URL in your browser. You land on the register page.

1. Fill in your name, email, and password, then click the primary action button.
2. Bento sends a verification email — open MailHog at `http://localhost:8025` and click the link.
3. Log in and you are prompted to create an organization.

<!-- SCREENSHOT: images/create-org-form.png — /org/new with all fields filled for Acme -->

Fill in the organization name and slug, then click "Create". You land on an empty board.

<!-- SCREENSHOT: images/empty-board.png — brand-new board, 4 default columns, no cards -->

## 5. Next steps

- [Core Concepts](./concepts.md) — understand organizations, boards, issues, and sprints
- [Environment Variables](../self-host/environment.md) — full reference for every `.env` key
- [Reverse Proxy & TLS](../self-host/reverse-proxy.md) — expose Bento with HTTPS
- [Email (SMTP)](../self-host/email.md) — switch from MailHog to a real SMTP provider
- [Backup & Restore](../self-host/backup.md) — protect your data before going to production
