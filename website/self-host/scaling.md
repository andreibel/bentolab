---
title: Scaling
description: Guidance on horizontally scaling Bento's microservices for higher load.
outline: [2, 3]
---

# Scaling

The default Docker Compose deployment runs one instance of each service. For higher traffic, you can scale individual services horizontally. This page covers the considerations for each layer.

## Stateless services

The following services are stateless and can be scaled horizontally by running multiple replicas:

| Service | Stateless? | Notes |
|---|---|---|
| api-gateway | Yes | All state in Redis (sessions, stale-token keys) |
| auth-service | Yes | No local state; JWT signing uses shared secret |
| org-service | Yes | No local state |
| board-service | Yes | No local state |
| task-service | Yes | No local state |
| notification-service | Yes | Kafka consumer group ensures one-at-a-time delivery |
| attachment-service | Yes | Files in MinIO; no local disk state |
| realtime-service | No | See note below |

**Realtime service** — The STOMP broker manages WebSocket sessions in memory. To scale realtime horizontally you need a shared broker (Redis pub/sub or a dedicated message broker). This is not configured in the current beta.

To scale a stateless service in Docker Compose:

```bash
docker compose -f docker-compose.beta.yml up -d --scale auth-service=3
```

In production, use Kubernetes with a Deployment and `replicas: N`.

## Kafka partitions

Kafka topics are created with a single partition by default. To distribute load across multiple notification or task service instances, increase the partition count for the relevant topics before starting the stack:

```bash
docker compose -f docker-compose.beta.yml exec kafka \
  kafka-topics --bootstrap-server localhost:29092 \
  --alter --topic bento.task.events --partitions 4
```

Each consumer group member will be assigned a subset of partitions. Match the number of partitions to the number of service replicas.

## Database read replicas

For read-heavy workloads, add PostgreSQL read replicas and configure the Spring services to route read queries to the replica. This requires configuring a JDBC DataSource with separate read and write URLs, which is beyond the scope of the beta compose file.

For MongoDB, add replica set members and use a connection string with `readPreference=secondaryPreferred`.

## Attachments on S3

When scaling the attachment service, switch from local MinIO to AWS S3 or another hosted S3-compatible store. Multiple attachment service instances can safely read and write to the same S3 bucket concurrently. See [File Storage (MinIO)](./storage-minio.md#using-aws-s3-instead).
