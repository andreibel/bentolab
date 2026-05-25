---
title: Self-Host Overview
description: Choose the right Bento deployment profile for your team size and hardware.
outline: [2, 3]
---

# Self-Host Overview

Bento ships as pre-built Docker images for `linux/amd64` and `linux/arm64`. You do not need to build anything from source. A single `docker compose up -d` brings up the entire stack.

## Deployment profiles

Bento ships with three deployment profiles:

| Profile | Database | Containers | RAM | Use Case |
|---|---|---|---|---|
| `cloud` | PostgreSQL + MongoDB + Redis | 12+ | ~4 GB | Kubernetes production |
| `selfhost` | PostgreSQL + Redis | 10 | ~3 GB | Self-host standard |
| `minimal` | SQLite + MongoDB | 7 | ~2.4 GB | Pi 5 / small team |

The `docker-compose.beta.yml` file in the repository uses the `selfhost` profile by default.

## When to pick each

### `selfhost` (recommended starting point)

Use this profile for a VPS, a home server, or any machine with at least 3 GB of RAM available for Bento. It runs all microservices, PostgreSQL, MongoDB, Redis, Kafka, MinIO, and the frontend. This is the profile described in [Quickstart](../guide/quickstart.md).

### `minimal`

Use this profile on hardware with limited RAM — a Raspberry Pi 4 or 5, a small cloud instance, or a developer laptop where you want low overhead. It replaces PostgreSQL with SQLite for the relational services and removes some optional services.

### `cloud`

Use this profile when deploying to Kubernetes in production. It assumes external managed databases (RDS, Atlas), external Redis (ElastiCache), and an S3-compatible object store. See [Scaling](./scaling.md) for cloud deployment guidance.

## What you'll need

Before starting any profile, confirm:

1. Docker 24+ installed with the Compose plugin (`docker compose version` returns output).
2. The ports listed in [Requirements](./requirements.md) are not in use.
3. You have generated the three required security secrets — see [Quickstart §2](../guide/quickstart.md#_2-configure-secrets).
4. An SMTP provider is available (or MailHog is acceptable for dev) — see [Email](./email.md).

::: tip Next step
Follow the [Quickstart](../guide/quickstart.md) to get running in 5 minutes, then return here to harden your installation.
:::
