---
title: Code Style
description: Java and TypeScript coding conventions for Bento contributors.
outline: [2, 3]
---

# Code Style

## Java

- Java 25. Use records for DTOs where appropriate.
- Spring Boot 4.0.x conventions: `@RestController`, `@Service`, `@Repository`.
- Jackson 3 (`tools.jackson.*`) — not `com.fasterxml.jackson`. Use `tools.jackson.databind.ObjectMapper`.
- No `JavaTimeModule` registration — it is built into Jackson 3 core and auto-registered.
- Kafka consumers use `StringDeserializer` and parse manually with `ObjectMapper.readValue()`. Do not use `JsonDeserializer`.
- MongoDB config uses `spring.mongodb.*` properties (not `spring.data.mongodb.*`).
- Spring WebFlux (api-gateway): define `ConcurrentKafkaListenerContainerFactory` as an explicit `@Bean` in a `@Configuration` class with `@EnableKafka`.

## TypeScript / React

- React 19 functional components. No class components.
- TypeScript strict mode.
- TailwindCSS for styling. Use CSS logical properties for RTL support (`ms-*`, `me-*`, `ps-*`, `pe-*`) instead of physical (`left-*`, `right-*`).
- React Query for server state. Zustand for client state.
- Do not call `setState` synchronously inside a `useEffect` body — derive state from props/refs or move logic to event handlers.
- RTL support: use `rtl:` and `ltr:` Tailwind variants. The `dir` attribute on `<html>` switches based on the active locale.

## Naming

Follow the file naming conventions from `CLAUDE.md`:

| Type | Convention | Example |
|---|---|---|
| Entity | `PascalCase.java` | `User.java`, `RefreshToken.java` |
| DTO (request) | `*Request.java` | `LoginRequest.java` |
| DTO (response) | `*Response.java` | `AuthResponse.java` |
| Service | `*Service.java` | `AuthService.java` |
| Controller | `*Controller.java` | `AuthController.java` |
| Repository | `*Repository.java` | `UserRepository.java` |
| Config | `*Config.java` / `*Properties.java` | `KafkaConfig.java` |

## Package structure

Each service follows this layout under `com.bento.{service}/`:

```
config/         # Configuration classes
controller/     # REST controllers
dto/
  request/      # Incoming DTOs
  response/     # Outgoing DTOs
entity/         # JPA/MongoDB entities
enums/          # Enumerations
event/          # Kafka event DTOs
exception/      # Custom exceptions
mapper/         # Entity ↔ DTO mappers
repository/     # Data access
security/       # Security filters, configs
service/        # Business logic
util/           # Utilities
```
