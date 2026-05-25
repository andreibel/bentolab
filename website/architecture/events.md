---
title: Events (Kafka)
description: Kafka topology, topics, event envelope format, and consumer groups in Bento.
outline: [2, 3]
---

# Events (Kafka)

Bento uses Apache Kafka in KRaft mode (no ZooKeeper). Services publish events when state changes and consume events from other services asynchronously.

## Kafka topology

One Kafka broker runs in KRaft mode in the default compose deployment. All topics use a single partition and a replication factor of 1. For production scale, increase partitions and add brokers — see [Scaling](../self-host/scaling.md).

Kafka advertises internally at `kafka:29092` (Docker network DNS). External access from the host is not exposed in the default compose file.

## Topics

| Topic | Producer | Example events |
|---|---|---|
| `bento.user.events` | auth-service | `EmailVerificationRequestedEvent`, `PasswordResetRequestedEvent`, `UserRegisteredEvent` |
| `bento.org.events` | org-service | `MemberRemovedEvent`, `MemberRoleChangedEvent`, `InvitationCreatedEvent` |
| `bento.board.events` | board-service | `BoardCreatedEvent`, `LabelCreatedEvent` |
| `bento.task.events` | task-service | `IssueCreatedEvent`, `IssueUpdatedEvent`, `CommentCreatedEvent`, `SprintClosedEvent` |
| `bento.attachment.events` | attachment-service | `AttachmentUploadedEvent` |

<!-- TODO: confirm complete event list from source -->

## Event envelope

All events are JSON-serialized. There is no shared schema enforced by Kafka — each service defines its own event classes. The gateway deserializes events using `tools.jackson.databind.ObjectMapper`.

Example `MemberRemovedEvent`:

```json
{
  "eventType": "MEMBER_REMOVED",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "orgId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "occurredAt": "2026-04-24T10:00:00Z"
}
```

Example `IssueCreatedEvent`:

```json
{
  "eventType": "ISSUE_CREATED",
  "issueId": "acme-42",
  "orgId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "boardId": "abc123",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
  "occurredAt": "2026-04-24T10:00:00Z"
}
```

## Consumer groups

| Consumer | Group ID | Topics consumed |
|---|---|---|
| api-gateway `OrgEventConsumer` | `api-gateway` | `bento.org.events` |
| notification-service | `notification-service` | `bento.user.events`, `bento.org.events`, `bento.task.events` |
| realtime-service | `realtime-service` | `bento.task.events`, `bento.board.events` |

Each consumer group tracks its own offsets. A new consumer group starts from the latest offset by default.

::: info String deserialization
Bento services use `StringDeserializer` for both key and value in Kafka consumers and then parse the JSON manually with `ObjectMapper`. The Spring Kafka `JsonDeserializer` is not used (deprecated in Spring Kafka 4.0).
:::
