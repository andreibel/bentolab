# Bento - Project Management System

## Overview
Bento is a self-hosted/cloud project management system similar to Jira. It supports Scrum and Kanban workflows with multi-tenancy.

## Architecture

### Microservices (Spring Boot 4.0 + Java 25)
| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| api-gateway | 8080 | - | JWT validation, routing |
| auth-service | 8081 | PostgreSQL + Redis | Identity, tokens |
| org-service | 8082 | PostgreSQL + Redis | Organizations, members |
| board-service | 8083 | PostgreSQL + Redis | Boards, columns, labels |
| task-service | 8084 | MongoDB + Redis | Issues, sprints, comments |
| notification-service | 8085 | MongoDB + Redis | Alerts, email, Discord |

### Frontend
- React 19 + Vite + TypeScript
- TailwindCSS
- React Query for data fetching
- Zustand for state management

### Infrastructure
- Docker + Docker Compose (local dev)
- Kubernetes (production)
- Terraform (AWS infrastructure)
- Ansible (configuration management)
- GitHub Actions (CI/CD)

## Tech Stack
- **Backend**: Spring Boot 4.0.2, Java 25, Gradle 9.3.1
- **Frontend**: React 19, Vite, TypeScript
- **Databases**: PostgreSQL 17, MongoDB 7, Redis 7
- **Messaging**: Apache Kafka 3.9 (KRaft mode)
- **Monitoring**: Prometheus, Grafana, Loki

## Key Design Decisions

### Authentication Flow
1. User logs in → Auth Service validates credentials
2. Auth Service → Org Service: Get user's organizations
3. Auth Service creates JWT with: userId, orgId, orgRole, orgSlug
4. Gateway validates JWT on every request, passes headers to services

### Database Strategy
- PostgreSQL: Relational data (users, orgs, boards)
- MongoDB: Document data (issues, comments, activities)
- Redis: Caching, sessions, rate limiting
- Each service owns its data (no shared databases)

### Multi-tenancy
- Cloud: Subdomain-based (acme.bento.io)
- Self-host: Single tenant or path-based

## Deployment Profiles

| Profile | Database | Containers | RAM | Use Case |
|---------|----------|------------|-----|----------|
| cloud | PostgreSQL + MongoDB + Redis | 12+ | ~4GB | K8S production |
| selfhost | PostgreSQL + Redis | 10 | ~3GB | Self-host standard |
| minimal | SQLite + MongoDB | 7 | ~2.4GB | Pi 5 / small team |

## Commands

### Backend
```bash
# Start infrastructure (from backend/)
cd services/auth-service
docker compose -f docker-compose.infra.yml up -d

# Run a service (from backend/)
./gradlew :services:auth-service:bootRun --args='--spring.profiles.active=dev'

# Build all services
./gradlew build

# Run tests
./gradlew test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
# Build service image
docker build -f services/auth-service/Dockerfile -t bento/auth-service:latest .

# Run full stack
docker compose -f docker-compose.yml up -d
```

## File Naming Conventions
- Entities: `PascalCase.java` (e.g., `User.java`, `RefreshToken.java`)
- DTOs: `*Request.java`, `*Response.java`, `*Dto.java`
- Services: `*Service.java`
- Controllers: `*Controller.java`
- Repositories: `*Repository.java`
- Config: `*Config.java`, `*Properties.java`

## Package Structure (per service)
```
com.bento.{service}/
├── config/          # Configuration classes
├── controller/      # REST controllers
├── dto/
│   ├── request/     # Incoming DTOs
│   └── response/    # Outgoing DTOs
├── entity/          # JPA/MongoDB entities
├── enums/           # Enumerations
├── event/           # Kafka event DTOs
├── exception/       # Custom exceptions
├── mapper/          # Entity ↔ DTO mappers
├── repository/      # Data access
├── security/        # Security filters, configs
├── service/         # Business logic
└── util/            # Utilities
```

## Important Files
- `docs/ENTITIES.md` - Complete entity documentation
- `backend/settings.gradle` - Gradle module definitions
- `backend/build.gradle` - Root build config
- `infra/terraform/` - AWS infrastructure
- `infra/k8s/` - Kubernetes manifests

## Testing
- Unit tests: JUnit 5 + Mockito
- Integration tests: Testcontainers
- API tests: REST Assured
- Frontend: Vitest + React Testing Library

## Git Conventions
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- Branches: `feature/`, `fix/`, `chore/`
- PRs: Squash merge to main
