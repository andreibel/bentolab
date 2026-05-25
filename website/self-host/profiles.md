---
title: Deployment Profiles
description: Details on Bento's cloud, selfhost, and minimal deployment profiles and how to switch between them.
outline: [2, 3]
---

# Deployment Profiles

Bento supports three deployment profiles that trade resource usage for capability. The profile controls which Spring Boot configuration is loaded at startup via `SPRING_PROFILES_ACTIVE`.

## cloud

The `cloud` profile is designed for Kubernetes deployments with externally managed infrastructure.

**Characteristics:**
- Connects to external PostgreSQL (e.g. AWS RDS), MongoDB Atlas, Redis (ElastiCache), and S3
- All 12+ application services run independently with horizontal scaling support
- No bundled infrastructure containers — you supply the databases
- Requires ~4 GB RAM across all pods (baseline, without replicas)

**When to use:** You are deploying to Kubernetes with managed cloud services and want production-grade reliability and scaling.

**How to activate:** Set `SPRING_PROFILES_ACTIVE=cloud` in each service's environment and supply the external database connection strings in your Kubernetes secrets.

## selfhost

The `selfhost` profile is the default in `docker-compose.beta.yml`. It bundles all infrastructure and runs on a single machine.

**Characteristics:**
- PostgreSQL 17, MongoDB 8, Redis 7, Kafka (KRaft) all run as Docker containers
- All 8 application services plus the frontend
- ~10 containers total
- Requires ~3 GB RAM

**When to use:** You have a VPS, home server, or any machine with 3+ GB RAM available, and you want a straightforward, self-contained deployment.

**How to activate:** This is the default. The compose file sets `SPRING_PROFILES_ACTIVE=docker` for each service, which maps to the `selfhost`-compatible configuration.

## minimal

The `minimal` profile reduces memory footprint by replacing PostgreSQL with SQLite for relational services and removing some non-essential services.

**Characteristics:**
- SQLite instead of PostgreSQL (no separate database containers for auth/org/board)
- MongoDB still used for task and notification data
- ~7 containers total
- Requires ~2.4 GB RAM

**When to use:** You are running on a Raspberry Pi 5, a very small VPS, or a developer laptop where you want the lightest possible footprint.

::: warning Minimal profile limitations
SQLite does not support concurrent writes the way PostgreSQL does. This profile is suitable for small teams (2–5 people) with light usage. Under high write concurrency it may exhibit delays.
:::

## Switching profiles

To switch from `selfhost` to `minimal`:

1. Stop the current stack: `docker compose -f docker-compose.beta.yml down`
2. Edit `SPRING_PROFILES_ACTIVE` in your `.env` or compose file to match the desired profile
3. If switching database engines, back up your data first — see [Backup & Restore](./backup.md)
4. Start the new stack: `docker compose -f docker-compose.beta.yml up -d`

::: danger Data migration
Switching between PostgreSQL and SQLite requires a data migration. There is no automatic migration tool in the current beta. Export your data before switching profiles.
:::
