---
title: Docker Compose
description: A walkthrough of Bento's docker-compose.beta.yml file — services, volumes, networks, and customization.
outline: [2, 3]
---

# Docker Compose

The `docker-compose.beta.yml` file in the repository root is the canonical starting point for self-hosting Bento. It pulls pre-built images from Docker Hub and wires them together. No source code checkout or build step is needed.

## File layout

The file is organized into two groups:

1. **Infrastructure services** — PostgreSQL, MongoDB, Redis, Kafka, MinIO, MailHog
2. **Application services** — api-gateway, auth-service, org-service, board-service, task-service, notification-service, realtime-service, attachment-service, frontend

All services share a default bridge network created by Compose. Service-to-service communication uses DNS names matching the service keys (e.g., `postgres-auth`, `kafka`, `redis`).

## Services

### Infrastructure

| Service | Image | Purpose |
|---|---|---|
| `postgres-auth` | `postgres:17` | Auth service database (`authdb`) |
| `postgres-org` | `postgres:17` | Org service database (`orgdb`) |
| `postgres-board` | `postgres:17` | Board service database (`boarddb`) |
| `redis` | `redis:7-alpine` | Sessions, caching, rate limiting, stale-token keys |
| `kafka` | `confluentinc/cp-kafka:8.2.0` | Event bus (KRaft mode — no ZooKeeper) |
| `mongo` | `mongo:8` | Task and notification databases |
| `minio` | `minio/minio` | S3-compatible file storage for attachments |
| `mailhog` | `mailhog/mailhog` | SMTP trap for development email |

### Application services

| Service | Image tag | Port (host) |
|---|---|---|
| `api-gateway` | `andreinw12/bento-api-gateway:v0.1.1-beta-4` | 8080 |
| `auth-service` | `andreinw12/bento-auth-service:v0.1.1-beta-4` | — |
| `org-service` | `andreinw12/bento-org-service:v0.1.1-beta-4` | — |
| `board-service` | `andreinw12/bento-board-service:v0.1.1-beta-4` | — |
| `task-service` | `andreinw12/bento-task-service:v0.1.1-beta-4` | — |
| `notification-service` | `andreinw12/bento-notification-service:v0.1.1-beta-4` | — |
| `realtime-service` | `andreinw12/bento-realtime-service:v0.1.1-beta-4` | — |
| `attachment-service` | `andreinw12/bento-attachment-service:v0.1.1-beta-4` | — |
| `frontend` | `andreinw12/bento-frontend:v0.1.1-beta-4` | 3000 |

Only `api-gateway` and `frontend` are exposed to the host by default. All other application services communicate over the internal Docker network.

## Volumes

Seven named volumes persist data across container restarts and upgrades:

```yaml
volumes:
  postgres_auth_data:
  postgres_org_data:
  postgres_board_data:
  redis_data:
  kafka_data:
  mongo_data:
  minio_data:
```

::: warning
Running `docker compose down -v` deletes all named volumes and all your data. Only run this for a full reset.
:::

## Networks

The compose file uses the default Compose bridge network. No explicit network definition is needed — all services can reach each other by service name.

## Healthchecks

Every infrastructure service has a healthcheck. Application services declare `depends_on` with `condition: service_healthy`, so they wait for their dependencies before starting. This prevents the "connection refused on startup" class of errors.

Example — Postgres healthcheck:

```yaml
healthcheck:
  test: pg_isready -U $$POSTGRES_USER -d authdb
  interval: 10s
  timeout: 5s
  start_period: 10s
  retries: 5
```

## Customizing ports

Several ports are configurable via environment variables in `.env`:

| Variable | Default | Controls |
|---|---|---|
| `FRONTEND_PORT` | `3000` | Host port mapped to the frontend container |
| `MAILHOG_UI_PORT` | `8025` | Host port for the MailHog web UI |

The API gateway is always on port `8080`. To move it, edit the `ports` mapping directly in the compose file.
