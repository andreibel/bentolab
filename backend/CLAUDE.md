# Bento Backend

## Structure
```
backend/
├── services/
│   ├── api-gateway/       # Spring Cloud Gateway
│   ├── auth-service/      # Authentication & users
│   ├── org-service/       # Organizations & members
│   ├── board-service/     # Boards, columns, labels
│   ├── task-service/      # Issues, sprints, comments
│   └── notification-service/
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

## Kafka Topics
- `bento.user.events`
- `bento.org.events`
- `bento.board.events`
- `bento.issue.events`
- `bento.sprint.events`
- `bento.notification.events`

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
