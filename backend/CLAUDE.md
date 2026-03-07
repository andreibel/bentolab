# Bento Backend

## Structure
```
backend/
├── api-gateway/       # Spring Cloud Gateway
├── auth-service/      # Authentication & users
├── org-service/       # Organizations & members
├── board-service/     # Boards, columns, labels
├── task-service/      # Issues, sprints, comments
├── notification-service/
├── libs/
│   ├── common/            # Shared DTOs, exceptions
│   ├── security-common/   # JWT utilities
│   └── kafka-events/      # Event DTOs
├── build.gradle           # Root build
├── settings.gradle        # Module definitions
└── gradlew
```

## Gradle Commands
```bash
# Build specific service
./gradlew :services:auth-service:build

# Run specific service
./gradlew :services:auth-service:bootRun --args='--spring.profiles.active=dev'

# Clean build
./gradlew clean build

# Skip tests
./gradlew build -x test
```

## Spring Profiles
- `dev` - Local development (services in IDE, infra in Docker)
- `docker` - Full Docker stack
- `selfhost` - Self-hosted deployment
- `minimal` - Minimal resources (SQLite, no Redis)
- `cloud` - Cloud/K8S deployment

## Dependencies
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0 (Oakwood)
- Java 25
- Gradle 9.3.1

## Database Connections (dev profile)
| Service | PostgreSQL | MongoDB | Redis |
|---------|------------|---------|-------|
| auth | localhost:5433/auth_db | - | localhost:6380 |
| org | localhost:5433/org_db | - | localhost:6380 |
| board | localhost:5433/board_db | - | localhost:6380 |
| task | - | localhost:27017/task | localhost:6380 |
| notification | - | localhost:27017/notif | localhost:6380 |

## Kafka Events

Only events with at least one consumer are listed.

Legend: 📤 publisher implemented — 📥 consumer implemented — ⏳ not yet implemented

### `bento.user.events` — published by **auth-service**
| Event | Fields | Publisher | Consumers |
|-------|--------|-----------|-----------|
| `UserRegisteredEvent` | `userId`, `email`, `firstName`, `lastName`, `registeredAt` | 📤 | ⏳ notification-service (welcome email) |
| `EmailVerificationRequestedEvent` | `userId`, `email`, `token`, `expiresAt` | ⏳ | ⏳ notification-service (send verification email) |

### `bento.org.events` — published by **org-service**
| Event | Fields | Publisher | Consumers |
|-------|--------|-----------|-----------|
| `MemberRemovedEvent` | `userId`, `orgId`, `eventType` | 📤 | 📥 api-gateway (stale token) |
| `MemberRoleChangedEvent` | `userId`, `orgId`, `eventType` | 📤 | 📥 api-gateway (stale token) |
| `InvitationCreatedEvent` | `orgId`, `orgName`, `invitedByUserId`, `inviteeEmail`, `role`, `token`, `expiresAt` | 📤 | ⏳ notification-service (invitation email) |
| `MemberJoinedEvent` | `orgId`, `orgName`, `newMemberId`, `role`, `joinedAt` | 📤 | ⏳ notification-service (welcome to org) |

### `bento.board.events` — published by **board-service**
| Event | Fields | Publisher | Consumers |
|-------|--------|-----------|-----------|
| `BoardDeletedEvent` | `boardId`, `orgId` | ⏳ | ⏳ task-service (delete all tasks/sprints/comments) |
| `BoardColumnDeletedEvent` | `columnId`, `boardId` | ⏳ | ⏳ task-service (move orphaned tasks to initial column) |
| `BoardMemberAddedEvent` | `boardId`, `boardName`, `userId`, `addedByUserId`, `boardRole` | ⏳ | ⏳ notification-service (notify added user) |
| `BoardMemberRemovedEvent` | `boardId`, `boardName`, `userId` | ⏳ | ⏳ task-service (unassign from tasks), ⏳ notification-service (notify removed user) |

### `bento.issue.events` — published by **task-service**
| Event | Fields | Publisher | Consumers |
|-------|--------|-----------|-----------|
| `IssueAssignedEvent` | `issueId`, `boardId`, `issueTitle`, `assigneeUserId`, `assignedByUserId` | ⏳ | ⏳ notification-service (notify assignee) |
| `IssueCommentedEvent` | `issueId`, `boardId`, `issueTitle`, `commentAuthorUserId`, `assigneeUserId` | ⏳ | ⏳ notification-service (notify assignee/watchers) |

### `bento.sprint.events` — published by **task-service**
| Event | Fields | Publisher | Consumers |
|-------|--------|-----------|-----------|
| `SprintStartedEvent` | `sprintId`, `boardId`, `sprintName`, `startDate`, `endDate` | ⏳ | ⏳ notification-service (notify board members) |
| `SprintCompletedEvent` | `sprintId`, `boardId`, `sprintName`, `completedIssues`, `remainingIssues` | ⏳ | ⏳ notification-service (notify board members) |

## Security Architecture (Gateway + Shared Secret)

### Core principle
**JWT validation happens exclusively in the api-gateway. Microservices never parse JWTs.**

### How it works
```
Client → Gateway → validates JWT → adds X-Internal-Secret + X-User-* headers → Service
Client → Service directly → GatewayAuthFilter rejects (bad/missing secret) → 401
```

### Gateway responsibilities
- Validate JWT (signature + expiry)
- Extract claims and forward as headers:
  - `X-User-Id` — userId (UUID)
  - `X-User-Email` — user email
  - `X-Org-Id` — current org (if present in JWT)
  - `X-Org-Role` — role in current org
  - `X-Org-Slug` — org slug
- Add `X-Internal-Secret: <shared-secret>` to every forwarded request
- Public endpoints (login, register, refresh) are forwarded without X-User-* headers

### Microservice Security Config (every service except gateway)
Each service has:
1. Spring Security set to `permitAll()` — no JWT parsing ever
2. A `GatewayAuthFilter` (custom OncePerRequestFilter) that:
   - Checks `X-Internal-Secret` header → wrong/missing → reject 401
   - Reads `X-User-Id` header → if present, populates SecurityContext
   - If `X-User-Id` absent (public endpoint) → SecurityContext is anonymous
3. CSRF disabled, sessions STATELESS

```java
// SecurityConfig pattern for all microservices
http
    .csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
    .addFilterBefore(gatewayAuthFilter, UsernamePasswordAuthenticationFilter.class);
```

### GatewayAuthFilter pattern
```java
// 1. Check X-Internal-Secret — reject if wrong
// 2. Read X-User-Id — populate SecurityContext if present
// 3. Continue filter chain
```

### Configuration
```yaml
internal:
  gateway-secret: ${GATEWAY_INTERNAL_SECRET}
```
Same secret value configured in api-gateway and all microservices via env var.

### TODO: api-gateway config
- Extract `email` claim from JWT → forward as `X-User-Email` header
  (needed for invitation accept endpoint in org-service to verify invitee identity)

## Common Patterns

### REST Controller
```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

### Service
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // implementation
    }
}
```

### Entity (JPA)
```java
@Entity
@Table(name = "users")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String email;
}
```

### Entity (MongoDB)
```java
@Document(collection = "issues")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Issue {
    @Id
    private String id;
    
    @Indexed
    private String orgId;
}
```
