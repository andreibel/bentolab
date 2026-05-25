---
title: Testing
description: Testing strategy for Bento — unit tests, integration tests, API tests, and frontend tests.
outline: [2, 3]
---

# Testing

## Unit tests

Unit tests cover individual classes with dependencies mocked. Framework: JUnit 5 + Mockito.

```bash
cd backend
./gradlew :services:auth-service:test
```

Test files live in `src/test/java/` mirroring the main source tree. Name test classes `*Test.java`.

## Integration tests (Testcontainers)

Integration tests spin up real databases and Kafka using Testcontainers. They test service behavior end-to-end without mocking the database layer.

```bash
cd backend
./gradlew :services:auth-service:integrationTest
```

::: info Real databases
Do not mock the database in integration tests. A mock that passes at the unit level can hide migration failures or query incompatibilities. Testcontainers spins up the real database image defined in the service's config.
:::

Integration test classes are named `*IT.java` and live in `src/integrationTest/java/`.

## API tests (REST Assured)

API tests run against a started application context and use REST Assured to make HTTP calls. They are the closest to end-to-end testing without a browser.

```bash
cd backend
./gradlew :services:auth-service:apiTest
```

## Frontend (Vitest)

Frontend unit and component tests use Vitest + React Testing Library.

```bash
cd frontend
npm run test
```

Coverage report:

```bash
npm run test:coverage
```

Test files live next to the components they test with a `.test.tsx` suffix.

## Running tests

All tests across all modules:

```bash
cd backend
./gradlew test
```

Frontend and backend in parallel (from repo root):

```bash
cd backend && ./gradlew test &
cd frontend && npm run test -- --run
wait
```
