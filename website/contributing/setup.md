---
title: Dev Setup
description: How to set up the Bento development environment locally.
outline: [2, 3]
---

# Dev Setup

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java | 25 | Use SDKMAN or the JDK download from OpenJDK |
| Gradle | 9.3.1 | The wrapper (`./gradlew`) handles this automatically |
| Node.js | 20+ | LTS recommended |
| Docker | 24+ | Required for infrastructure (Postgres, Kafka, Redis, Mongo) |
| IntelliJ IDEA | 2024+ | Recommended IDE; use the Gradle test runner, not IntelliJ's built-in |

## Clone & bootstrap

```bash
git clone https://github.com/andreibel/bento.git
cd bento
```

The repository structure:

```
bento/
├── backend/          # Gradle multi-project (all services)
├── frontend/         # React 19 + Vite
├── infra/            # Terraform, Kubernetes, Ansible
└── docs/             # Reference documentation
```

## Backend dev run

Each service has its own infrastructure. Start the infrastructure for a service before running it:

```bash
# Example: auth-service
cd backend/services/auth-service
docker compose -f docker-compose.infra.yml up -d
```

Then run the service from the project root:

```bash
cd backend
./gradlew :services:auth-service:bootRun --args='--spring.profiles.active=dev'
```

To build all services:

```bash
cd backend
./gradlew build
```

To run all tests:

```bash
cd backend
./gradlew test
```

## Frontend dev run

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:5173` (or the next available port) and proxies API calls to the gateway at `http://localhost:8080`.

## IDE setup

1. Open the `backend/` directory in IntelliJ IDEA as a Gradle project.
2. In **Settings → Build, Execution, Deployment → Build Tools → Gradle**, set "Run tests using" to **Gradle** (not IntelliJ IDEA). This prevents the `InternalIdeaModule` cast error that occurs when IntelliJ tries to run Gradle tests natively.
3. Ensure the JDK is set to Java 25 in Project Structure.

::: tip Gradle wrapper
Always use `./gradlew` (the wrapper) rather than a system-installed Gradle. This ensures the correct Gradle version (9.3.1) is used.
:::
