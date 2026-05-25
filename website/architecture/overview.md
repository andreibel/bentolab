---
title: Architecture Overview
description: High-level architecture of the Bento project management system — services, data stores, and event bus.
outline: [2, 3]
---

# Architecture Overview

Bento is built as a set of independent microservices communicating over Apache Kafka. Each service owns its data store. The API gateway is the single entry point for all client traffic.

## High-level diagram

![Bento architecture diagram](/images/architecture-diagram.png)

## Services at a glance

| Service | Port | Primary store | Responsibility |
|---|---|---|---|
| api-gateway | 8080 | — | JWT validation, rate limiting, routing |
| auth-service | 8081 | PostgreSQL + Redis | Login, registration, token refresh, email verification |
| org-service | 8082 | PostgreSQL + Redis | Organizations, members, roles, invitations |
| board-service | 8083 | PostgreSQL + Redis | Boards, columns, labels, board members |
| task-service | 8084 | MongoDB + Redis | Issues, sprints, comments, activities, time logs |
| notification-service | 8085 | MongoDB + Redis | Email, in-app notifications, Discord webhooks |
| realtime-service | 8086 | Redis | Live board updates via WebSocket/STOMP |
| attachment-service | 8087 | MinIO + Postgres | File uploads and attachment metadata |

## Data stores

| Store | Used by | Purpose |
|---|---|---|
| PostgreSQL 17 | auth, org, board, attachment | Relational data — users, orgs, boards, tokens |
| MongoDB 8 | task, notification | Document data — issues, comments, activities, notifications |
| Redis 7 | all services | Caching, sessions, rate limiting, stale-token keys, pub/sub |
| MinIO | attachment | S3-compatible file storage for attachments |

Each service has its own database — cross-service queries go through the API, never directly between databases.

## Event bus

Services communicate asynchronously through Apache Kafka (KRaft mode — no ZooKeeper). Events are JSON payloads published to named topics. Consumers use dedicated consumer groups so each service processes events independently.

| Topic | Producer | Example events |
|---|---|---|
| `bento.user.events` | auth-service | `UserRegisteredEvent`, `EmailVerificationRequestedEvent` |
| `bento.org.events` | org-service | `MemberRemovedEvent`, `MemberRoleChangedEvent` |
| `bento.board.events` | board-service | `BoardCreatedEvent`, `LabelCreatedEvent` |
| `bento.task.events` | task-service | `IssueCreatedEvent`, `CommentCreatedEvent`, `SprintClosedEvent` |
| `bento.attachment.events` | attachment-service | `AttachmentUploadedEvent` |

## Read this next

- [Services](./services.md) — per-service deep-dive with ports, topics, and trusted headers
- [Auth Flow](./auth-flow.md) — how JWT tokens are issued, validated, and invalidated
- [Events (Kafka)](./events.md) — full topic and event envelope reference
- [Realtime (WebSocket)](./realtime.md) — STOMP endpoints and presence protocol
