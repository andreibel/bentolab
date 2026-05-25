---
title: Realtime (WebSocket)
description: Bento's WebSocket/STOMP architecture for live board updates, presence, and reconnection.
outline: [2, 3]
---

# Realtime (WebSocket)

Bento uses STOMP over WebSocket to push live updates to connected clients. The realtime service consumes Kafka events and broadcasts them to subscribed sessions.

## STOMP endpoints

| Endpoint | Protocol | Notes |
|---|---|---|
| `/ws` | WebSocket + STOMP | Clients connect here to establish the STOMP session |

The WebSocket endpoint is served by the realtime service on port 8086. The API gateway (or your reverse proxy) must forward WebSocket upgrade requests to this service. See [Reverse Proxy & TLS](../self-host/reverse-proxy.md#websocket-pass-through).

## Destinations

Clients subscribe to STOMP destinations to receive updates:

| Destination | Content | Scope |
|---|---|---|
| `/topic/board/{boardId}` | Board events (issue moves, creates, deletes) | All clients watching a board |
| `/topic/board/{boardId}/presence` | Presence updates (who is online) | All clients watching a board |
| `/user/queue/notifications` | Personal in-app notifications | Specific user |

## Presence

When a user opens a board:

1. The client sends a STOMP subscribe to `/topic/board/{boardId}/presence`.
2. The realtime service records the user as present on the board in Redis.
3. A presence update is broadcast to all subscribers on that board.

When a user closes the tab or the WebSocket disconnects:

1. The realtime service detects the session close.
2. It removes the user from the board's presence set in Redis.
3. A presence update is broadcast to remaining subscribers.

The presence set in Redis expires automatically if the session record is not refreshed (heartbeat mechanism).

## Board updates

When an issue is moved, created, or updated:

1. The task service (or board service) publishes an event to the relevant Kafka topic.
2. The realtime service's Kafka consumer receives the event.
3. The service pushes the update to all STOMP sessions subscribed to `/topic/board/{boardId}`.
4. The client's frontend updates the board state without requiring a page refresh.

## Reconnection

The frontend STOMP client implements exponential backoff reconnection:

- On disconnect, wait 1 second before retrying.
- Each retry doubles the wait up to a maximum of 30 seconds.
- On successful reconnect, re-subscribe to all previous destinations.
- Board state is re-fetched from the REST API on reconnect to catch any updates missed during the disconnection window.
