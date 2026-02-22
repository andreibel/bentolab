# 🍱 Bento

**Open-source project management for teams who want control.**

Self-hosted or cloud. Scrum or Kanban. Your data, your rules.

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-25-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)

---

## ✨ Features

- **🏢 Multi-tenant** — Organizations, teams, and role-based access
- **📋 Scrum & Kanban** — Sprints, backlogs, and customizable boards
- **🔍 Powerful search** — Find anything instantly
- **📊 Analytics** — Velocity, burndown, and team insights
- **🔔 Notifications** — Email, in-app, and Discord
- **🐳 Self-hosted** — Run on a Raspberry Pi or your own servers
- **☁️ Cloud-ready** — Kubernetes, Terraform, full CI/CD

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                          Clients                                 │
│                    (Web / Mobile / Desktop)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                   (JWT validation, routing)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        ▼         ▼           ▼           ▼         ▼
    ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
    │ Auth  │ │  Org  │ │ Board │ │ Task  │ │Notif. │
    │Service│ │Service│ │Service│ │Service│ │Service│
    └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
        │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼
    ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
    │Postgres│ │Postgres│ │Postgres│ │MongoDB│ │MongoDB│
    └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Apache Kafka  │
                    └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 25 (for development)
- Node.js 20+ (for frontend)

### One-Command Deploy (Self-Hosted)
```bash
curl -fsSL https://get.bento.dev | bash
```

Or manually:
```bash
git clone https://github.com/yourusername/bento.git
cd bento
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080) 🎉

### Development Setup
```bash
# Clone
git clone https://github.com/yourusername/bento.git
cd bento

# Start infrastructure
cd backend/services/auth-service
docker compose -f docker-compose.infra.yml up -d

# Run backend (from backend/)
cd ../../
./gradlew :services:auth-service:bootRun --args='--spring.profiles.active=dev'

# Run frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 📦 Deployment Options

| Mode | RAM | Use Case |
|------|-----|----------|
| **Minimal** | ~2.5GB | Raspberry Pi, small teams |
| **Standard** | ~3.5GB | Self-hosted, medium teams |
| **Cloud** | ~4GB+ | Kubernetes, enterprise |

### Minimal (Raspberry Pi / Low Resources)
```bash
docker compose -f docker-compose.minimal.yml up -d
```

- SQLite instead of PostgreSQL
- No Redis (in-memory caching)
- 7 containers total

### Standard (Self-Hosted)
```bash
docker compose up -d
```

### Cloud (Kubernetes)
```bash
# With Terraform
cd infra/terraform/environments/prod
terraform apply

# Deploy to K8S
kubectl apply -k infra/k8s/overlays/prod
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 25 | Language |
| Spring Boot | 4.0.2 | Framework |
| Spring Cloud | 2025.1.0 | Gateway, config |
| PostgreSQL | 17 | Relational data |
| MongoDB | 7 | Document data |
| Redis | 7 | Caching |
| Kafka | 3.9 | Event streaming |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| React Query | Data fetching |
| Zustand | State management |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Orchestration |
| Terraform | Infrastructure as code |
| Ansible | Configuration management |
| GitHub Actions | CI/CD |
| Prometheus + Grafana | Monitoring |

---

## 📁 Project Structure
```
bento/
├── backend/
│   ├── services/
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── org-service/
│   │   ├── board-service/
│   │   ├── task-service/
│   │   └── notification-service/
│   ├── libs/
│   │   ├── common/
│   │   ├── security-common/
│   │   └── kafka-events/
│   ├── build.gradle
│   └── settings.gradle
├── frontend/
│   ├── src/
│   └── package.json
├── infra/
│   ├── docker/
│   ├── k8s/
│   ├── terraform/
│   └── ansible/
├── docs/
├── CLAUDE.md
└── README.md
```

---

## 🔐 Services Overview

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| **api-gateway** | 8080 | — | Routing, JWT validation |
| **auth-service** | 8081 | PostgreSQL | Users, authentication, tokens |
| **org-service** | 8082 | PostgreSQL | Organizations, members, invites |
| **board-service** | 8083 | PostgreSQL | Boards, columns, labels |
| **task-service** | 8084 | MongoDB | Issues, sprints, comments |
| **notification-service** | 8085 | MongoDB | Alerts, email, Discord |

---

## 🗄️ Database Schema

See [docs/ENTITIES.md](docs/ENTITIES.md) for complete entity documentation.

### Summary

| Service | Entities |
|---------|----------|
| Auth | User, RefreshToken |
| Org | Organization, OrganizationMember, OrgInvitation |
| Board | Board, BoardColumn, BoardMember, Label |
| Task | Issue, Sprint, Comment, TimeLog, Activity |
| Notification | Notification, NotificationPreference |

---

## 🔌 API Documentation

API documentation is available at:

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

### Authentication
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# Use token
curl http://localhost:8080/api/boards \
  -H "Authorization: Bearer <access_token>"
```

---

## 🧪 Testing
```bash
# All tests
./gradlew test

# Specific service
./gradlew :services:auth-service:test

# With coverage
./gradlew test jacocoTestReport
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ⚠️ If you modify and host it as a service, you **must** release your source code
- ⚠️ Derivative works must use the same license

See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by Jira, Linear, and Plane
- Built with Spring Boot, React, and ❤️

---

<p align="center">
  <img src="docs/assets/logo.svg" alt="Bento Logo" width="80">
  <br>
  <strong>Bento</strong> — Organize your work, one box at a time.
</p>
