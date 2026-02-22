# Auth Service

Bento authentication and user management service.

## Responsibility

- User registration and login
- JWT access token **generation** (NOT validation — validation is in api-gateway)
- Refresh token management
- Password reset
- User profile management
- Publish user events to Kafka

## Security Architecture

**JWT validation is exclusively in the api-gateway.** The auth-service never parses incoming JWTs.

For protected endpoints (`/logout`, `/switch-org`, `/users/me`), the gateway:
1. Validates the JWT signature and expiry
2. Extracts `userId` from the token claims
3. Forwards it as `X-User-Id` header to the auth-service

`JwtAuthenticationFilter` in this service only reads the `X-User-Id` header and populates the Spring `SecurityContext`. It does **not** do any JWT parsing.

`JwtService` only generates access tokens — it has no parse/validate methods.

## Tech Stack

- Spring Boot 4.0.2
- Java 25
- PostgreSQL (users, refresh_tokens)
- Redis (sessions, token blacklist, password reset)
- Kafka (user events)
- JWT (jjwt library)

---

## Token System

### Access Token vs Refresh Token

| | Access Token | Refresh Token |
|---|---|---|
| **Purpose** | Proves identity on every API request | Gets new access token when expired |
| **Lifetime** | 15 minutes | 7 days |
| **Storage (Server)** | Not stored (stateless JWT) | Stored in `refresh_tokens` table |
| **Storage (Client)** | Memory / localStorage | HttpOnly cookie or secure storage |
| **Sent with** | Every API request (`Authorization: Bearer ...`) | Only to `/api/auth/refresh` |
| **Contains** | User claims (userId, orgId, orgRole) | Random UUID string |
| **Revocable** | No (wait for expiry) or Redis blacklist | Yes (set `revoked=true` in DB) |

### Why Two Tokens?let 
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   PROBLEM: Single long-lived token                              │
│   ─────────────────────────────────                              │
│   • If stolen → attacker has access for days/weeks              │
│   • Can't revoke without DB check on every request (slow)       │
│                                                                  │
│   SOLUTION: Two tokens                                          │
│   ────────────────────────                                       │
│   • Access Token: short-lived (15 min), stateless, fast         │
│   • Refresh Token: long-lived (7 days), in DB, revocable        │
│                                                                  │
│   If stolen:                                                     │
│   • Access token only → max 15 min damage                       │
│   • Refresh token → user logs out → token revoked → useless     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Access Token (JWT)

**Structure:**
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC...  (encoded)
       ↓
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // userId
  "email": "user@example.com",
  "systemRole": "USER",
  "orgId": "770e8400-...",                        // current org
  "orgRole": "ORG_ADMIN",                         // role in org
  "orgSlug": "acme",                              // for URL routing
  "iat": 1706900000,                              // issued at
  "exp": 1706900900                               // expires (15 min)
}
```

**Validation:** Server checks signature + expiry. No database call needed (stateless).

**Generation:**
```java
public String generateAccessToken(User user, UserOrgDto org) {
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("email", user.getEmail())
        .claim("systemRole", user.getSystemRole().name())
        .claim("orgId", org != null ? org.orgId().toString() : null)
        .claim("orgRole", org != null ? org.orgRole() : null)
        .claim("orgSlug", org != null ? org.orgSlug() : null)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 900000)) // 15 min
        .signWith(secretKey)
        .compact();
}
```

### Refresh Token

**Structure:** Random UUID string (opaque)
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Storage:** `refresh_tokens` table
```sql
| id   | token      | user_id | device_info | ip_address | expires_at | revoked | created_at |
|------|------------|---------|-------------|------------|------------|---------|------------|
| uuid | "a1b2c3.." | uuid    | "Chrome/Mac"| "1.2.3.4"  | +7 days    | false   | now        |
```

**Validation:** Server looks up token in DB, checks `revoked` and `expires_at`.

**Generation:**
```java
public RefreshToken createRefreshToken(User user, String deviceInfo, String ipAddress) {
    RefreshToken token = RefreshToken.builder()
        .token(UUID.randomUUID().toString())
        .user(user)
        .deviceInfo(deviceInfo)
        .ipAddress(ipAddress)
        .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
        .revoked(false)
        .build();
    return refreshTokenRepository.save(token);
}
```

---

## Token Flows

### Login Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Client: POST /api/auth/login { email, password }            │
│                                                                  │
│  2. Auth Service:                                                │
│     ├─ Find user by email                                       │
│     ├─ Verify password (BCrypt)                                 │
│     ├─ Check isActive, isEmailVerified                          │
│     └─ Call Org Service: GET /api/internal/orgs/user/{userId}   │
│                                                                  │
│  3. Org Service returns:                                         │
│     [{ orgId, orgRole, orgSlug, orgName }, ...]                 │
│                                                                  │
│  4. Auth Service:                                                │
│     ├─ Generate Access Token (JWT with org context)             │
│     ├─ Create Refresh Token (save to DB)                        │
│     └─ Update user.lastLoginAt                                  │
│                                                                  │
│  5. Response:                                                    │
│     {                                                            │
│       "accessToken": "eyJhbG...",                               │
│       "refreshToken": "a1b2c3d4-...",                           │
│       "user": { id, email, firstName, ... },                    │
│       "organizations": [{ orgId, orgName, orgRole }, ...]       │
│     }                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Request Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Client: GET /api/boards                                     │
│     Header: Authorization: Bearer eyJhbG...                     │
│                                                                  │
│  2. API Gateway:                                                 │
│     ├─ Extract JWT from header                                  │
│     ├─ Validate signature + expiry (no DB call)                 │
│     ├─ Extract claims: userId, orgId, orgRole                   │
│     └─ Add headers: X-User-Id, X-Org-Id, X-Org-Role            │
│                                                                  │
│  3. Board Service:                                               │
│     ├─ Read headers (trusts gateway)                            │
│     └─ Return boards for orgId                                  │
│                                                                  │
│  (If JWT invalid/expired → 401 Unauthorized)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Client: Access token expired (401 from API)                 │
│                                                                  │
│  2. Client: POST /api/auth/refresh                              │
│     Body: { "refreshToken": "a1b2c3d4-..." }                    │
│                                                                  │
│  3. Auth Service:                                                │
│     ├─ Find refresh token in DB                                 │
│     ├─ Check: revoked == false?                                 │
│     ├─ Check: expiresAt > now?                                  │
│     ├─ Get user from token.user                                 │
│     ├─ Call Org Service for current org context                 │
│     └─ Generate NEW access token                                │
│                                                                  │
│  4. Response:                                                    │
│     {                                                            │
│       "accessToken": "eyJhbG...(new)",                          │
│       "refreshToken": "a1b2c3d4-..."  (same or rotated)         │
│     }                                                            │
│                                                                  │
│  5. Client: Retry original request with new token               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Logout Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Client: POST /api/auth/logout                               │
│     Header: Authorization: Bearer eyJhbG...                     │
│     Body: { "refreshToken": "a1b2c3d4-..." }                    │
│                                                                  │
│  2. Auth Service:                                                │
│     ├─ Find refresh token in DB                                 │
│     ├─ Set revoked = true                                       │
│     └─ (Optional) Add access token to Redis blacklist           │
│                                                                  │
│  3. Result:                                                      │
│     • Refresh token can't be used anymore                       │
│     • Access token expires naturally in ≤15 min                 │
│     • (Or blocked immediately if using blacklist)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Switch Organization Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  User belongs to: Personal (owner), TechCorp (admin), OSS (member)
│  Currently in: TechCorp                                          │
│  Wants to switch to: Personal                                   │
│                                                                  │
│  1. Client: POST /api/auth/switch-org                           │
│     Header: Authorization: Bearer eyJhbG... (TechCorp context)  │
│     Body: { "orgId": "personal-org-uuid" }                      │
│                                                                  │
│  2. Auth Service:                                                │
│     ├─ Validate current JWT                                     │
│     ├─ Call Org Service: verify user belongs to new org         │
│     ├─ Get user's role in new org                               │
│     ├─ Update user.currentOrgId                                 │
│     └─ Generate NEW access token with new org context           │
│                                                                  │
│  3. Response:                                                    │
│     {                                                            │
│       "accessToken": "eyJhbG...(new, Personal context)",        │
│       "refreshToken": "..."                                      │
│     }                                                            │
│                                                                  │
│  4. Client: Replace stored tokens, reload dashboard             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database

**PostgreSQL Tables:**
- `users` — User accounts
- `refresh_tokens` — JWT refresh tokens

**Redis Keys:**
- `session:{userId}:{orgId}` — Active sessions
- `blacklist:{jwtToken}` — Revoked access tokens (optional)
- `pwd_reset:{token}` — Password reset tokens
- `user:{userId}:profile` — User profile cache

---

## Package Structure
```
com.bento.auth/
├── config/
│   ├── SecurityConfig.java
│   ├── JwtProperties.java
│   ├── RedisConfig.java
│   └── KafkaProducerConfig.java
├── controller/
│   ├── AuthController.java
│   └── UserController.java
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── RefreshTokenRequest.java
│   │   ├── SwitchOrgRequest.java
│   │   └── PasswordResetRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── TokenResponse.java
│       ├── UserDto.java
│       └── UserOrgDto.java
├── entity/
│   ├── User.java
│   └── RefreshToken.java
├── enums/
│   └── SystemRole.java
├── event/
│   ├── UserEventPublisher.java
│   └── dto/
│       └── UserEvent.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── UserNotFoundException.java
│   ├── EmailAlreadyExistsException.java
│   └── InvalidTokenException.java
├── mapper/
│   └── UserMapper.java
├── repository/
│   ├── UserRepository.java
│   └── RefreshTokenRepository.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   └── JwtAuthEntryPoint.java
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── JwtService.java
│   ├── RefreshTokenService.java
│   └── PasswordResetService.java
└── AuthServiceApplication.java
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Revoke refresh token |
| POST | `/api/auth/switch-org` | Yes | Switch organization |
| POST | `/api/auth/password-reset/request` | No | Request password reset |
| POST | `/api/auth/password-reset/confirm` | No | Confirm password reset |
| GET | `/api/users/me` | Yes | Get current user |
| PATCH | `/api/users/me` | Yes | Update current user |

---

## DTOs

### RegisterRequest
```java
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName
) {}
```

### LoginRequest
```java
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
```

### RefreshTokenRequest
```java
public record RefreshTokenRequest(
    @NotBlank String refreshToken
) {}
```

### SwitchOrgRequest
```java
public record SwitchOrgRequest(
    @NotNull UUID orgId
) {}
```

### AuthResponse
```java
public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserDto user,
    List<UserOrgDto> organizations
) {}
```

### TokenResponse
```java
public record TokenResponse(
    String accessToken,
    String refreshToken
) {}
```

### UserOrgDto
```java
public record UserOrgDto(
    UUID orgId,
    String orgName,
    String orgSlug,
    String orgRole,
    String logoUrl
) {}
```

---

## Kafka Events

**Topic:** `bento.user.events`

| Event Type | Trigger | Data |
|------------|---------|------|
| `user.registered` | Registration | userId, email, firstName, lastName |
| `user.logged_in` | Login | userId, deviceInfo |
| `user.updated` | Profile update | userId, changedFields |
| `user.password_reset` | Password reset | userId, email |
| `user.deactivated` | Account deactivation | userId, deactivatedBy |

---

## Configuration

**application.yml:**
```yaml
server:
  port: 8081
  servlet:
    context-path: /api/auth

spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/auth_db
    username: auth_user
    password: ${DB_PASSWORD}
  
  data:
    redis:
      host: localhost
      port: 6380
  
  kafka:
    bootstrap-servers: localhost:9093
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: 900000      # 15 minutes
  refresh-token-expiration: 604800000  # 7 days
```

---

## Commands
```bash
# Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# Run service
./gradlew :services:auth-service:bootRun --args='--spring.profiles.active=dev'

# Run tests
./gradlew :services:auth-service:test

# Build
./gradlew :services:auth-service:build
```

---

## Security Considerations

| Scenario | Protection |
|----------|------------|
| Access token stolen | Max 15 min exposure |
| Refresh token stolen | User logs out → revoked in DB |
| Both tokens stolen | Logout revokes refresh, access expires in 15 min |
| Password changed | Revoke ALL refresh tokens for user |
| Suspicious activity | Revoke specific token by device/IP |
| Brute force | Rate limiting (Redis counter) |