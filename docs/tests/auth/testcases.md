# Auth Service — Test Cases

Total: **111 tests**, **0 failures**

| Layer | Class | Tests |
|-------|-------|------:|
| Repository | `UserRepositoryTest` | 12 |
| Repository | `RefreshTokenRepositoryTest` | 14 |
| Repository | `EmailVerificationTokenRepositoryTest` | 10 |
| Repository | `PasswordResetTokenRepositoryTest` | 10 |
| Service | `AuthServiceTest` | 18 |
| Service | `EmailVerificationServiceTest` | 10 |
| Service | `PasswordResetServiceTest` | 9 |
| Service | `RefreshTokenServiceTest` | 12 |
| Service | `UserServiceTest` | 7 |
| Service | `JwtServiceTest` | 9 |

---

## Repository Tests

> **Setup**: `@DataJpaTest` + H2 in-memory DB + `spring.liquibase.enabled=false`
> Hibernate creates schema from JPA entities. Each test runs in a rolled-back transaction.
> `EntityManager.clear()` is called after `@Modifying` bulk-update queries to bypass the first-level cache.

---

### `UserRepositoryTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `save_persistsUserWithGeneratedId` | Save assigns a UUID primary key | Build a `User` with no id | `save()` | Returned user has non-null id; `findById` returns it |
| `findByEmail_existingUser_returnsUser` | `findByEmail` finds by exact email | Save a user | `findByEmail("john@example.com")` | Present; email matches |
| `findByEmail_unknownEmail_returnsEmpty` | `findByEmail` returns empty for unknown | No user saved | `findByEmail("nobody@example.com")` | Empty optional |
| `existsByEmail_existingUser_returnsTrue` | `existsByEmail` returns true for known email | Save a user | `existsByEmail` | `true` |
| `existsByEmail_unknownEmail_returnsFalse` | `existsByEmail` returns false for unknown | No user saved | `existsByEmail` | `false` |
| `save_duplicateEmail_throwsDataIntegrityViolation` | Unique constraint on `email` column | Save a user | `saveAndFlush` with same email | `DataIntegrityViolationException` |
| `defaultValues_areSetOnSave` | JPA/Lombok `@Builder.Default` values are persisted | Build user with no explicit defaults | `save()` | `systemRole=USER`, `active=true`, `emailVerified=false`, timestamps set, org/login null |
| `bcrypt_hashFormat_startsWithAlgoPrefix` | BCrypt hash format starts with `$2a$` | Encode a password | `encode()` | Starts with `$2a$`, length > 50 |
| `bcrypt_correctPassword_matchesStoredHash` | `matches(raw, hash)` is true for correct password | Encode `"password123"` | `matches(raw, hash)` | `true` |
| `bcrypt_wrongPassword_doesNotMatchStoredHash` | `matches` is false for wrong password | Encode `"correctPassword"` | `matches("wrongPassword", hash)` | `false` |
| `bcrypt_samePasswordEncodedTwice_producesDifferentHashes` | BCrypt uses random salt — hashes differ per call | Encode same password twice | Compare hashes | Not equal; both verify correctly |
| `bcrypt_storedHashInDb_canBeRetrievedAndVerified` | Full register→login cycle: store hash, retrieve, verify | Save user with BCrypt hash | `findByEmail` then `matches` | Stored hash starts `$2a$`; correct password matches, wrong doesn't |

---

### `RefreshTokenRepositoryTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `findByToken_existingToken_returnsToken` | `findByToken` finds by exact token string | Save a token | `findByToken("tok-abc")` | Present; id matches |
| `findByToken_unknownToken_returnsEmpty` | `findByToken` returns empty for unknown | No token saved | `findByToken("does-not-exist")` | Empty |
| `findLatestActive_activeToken_returnsIt` | Active, non-expired token is found | Save active token | `findLatestActiveByUserId` | Present |
| `findLatestActive_revokedToken_returnsEmpty` | Revoked token is excluded | Save revoked token | `findLatestActiveByUserId` | Empty |
| `findLatestActive_expiredToken_returnsEmpty` | Expired token is excluded | Save token with `expiresAt` in the past | `findLatestActiveByUserId` | Empty |
| `findLatestActive_multipleActive_returnsNewest` | Query orders by `createdAt DESC LIMIT 1` | Save two tokens with explicit `createdAt` 60 s apart | `findLatestActiveByUserId` | Returns the one with `createdAt = now` |
| `findLatestActive_noTokensForUser_returnsEmpty` | No tokens → empty | Nothing saved for user | `findLatestActiveByUserId` | Empty |
| `findLatestActive_activeTokenBelongsToOtherUser_returnsEmpty` | Tokens of other users are excluded | Save active token for a different user | `findLatestActiveByUserId(savedUser)` | Empty |
| `revokeAllByUserId_revokesAllActiveTokens` | Bulk update sets `revoked=true` on all active tokens for user | Save 2 active tokens; call bulk update; `em.clear()` | `findAll()` | Both are revoked |
| `revokeAllByUserId_doesNotAffectOtherUsers` | Bulk update is scoped to one user | Save active token for user + active token for another user | `revokeAllByUserId(user)` | Other user's token still not revoked |
| `revokeAllByUserId_alreadyRevokedToken_remainsRevoked` | Query targets `revoked=false` only | Save already-revoked token | `revokeAllByUserId` | Token stays revoked (no error, idempotent) |
| `revokeAllByUserId_noTokens_doesNothing` | No-op when user has no tokens | Nothing saved | `revokeAllByUserId` | No exception; `findAll()` empty |
| `save_duplicateToken_throwsDataIntegrityViolation` | Unique constraint on `token` column | Save a token | `saveAndFlush` with same token string | `DataIntegrityViolationException` |
| `save_setsDefaultValues` | `revoked=false`, `createdAt` set on save | Build token | `save()` | `id` non-null, `revoked=false`, `createdAt` non-null |

---

### `EmailVerificationTokenRepositoryTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `findByToken_existingToken_returnsToken` | Finds token by string | Save unused token | `findByToken` | Present; id matches |
| `findByToken_unknownToken_returnsEmpty` | Returns empty for unknown | Nothing saved | `findByToken` | Empty |
| `findByToken_usedToken_stillReturnsIt` | `findByToken` does NOT filter by `used` — callers validate | Save used token | `findByToken` | Present (service checks `used` flag) |
| `findByToken_expiredToken_stillReturnsIt` | `findByToken` does NOT filter by expiry — callers validate | Save expired token | `findByToken` | Present (service checks expiry) |
| `invalidateAllByUserId_marksAllUnusedTokensAsUsed` | Bulk update sets `used=true` for all unused tokens of user | Save 2 unused tokens; call bulk update; `em.clear()` | `findAll()` | Both marked used |
| `invalidateAllByUserId_doesNotAffectAlreadyUsedTokens` | Query targets `used=false` only | Save already-used token | `invalidateAllByUserId` | Token stays used (idempotent) |
| `invalidateAllByUserId_doesNotAffectOtherUsers` | Scoped to one user | Save unused token for user + unused token for another user | `invalidateAllByUserId(user)` | Other user's token still unused |
| `invalidateAllByUserId_noTokens_doesNothing` | No-op when user has no tokens | Nothing saved | `invalidateAllByUserId` | No exception |
| `save_setsDefaultValues` | `used=false`, `createdAt` and `expiresAt` set | Build token | `save()` | `id` non-null, `used=false`, timestamps set |
| `save_duplicateToken_throwsDataIntegrityViolation` | Unique constraint on `token` column | Save a token | `saveAndFlush` with same token | `DataIntegrityViolationException` |

---

### `PasswordResetTokenRepositoryTest`

Same structure as `EmailVerificationTokenRepositoryTest` — same custom queries, same unique constraint.

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `findByToken_existingToken_returnsToken` | Finds by string | Save unused token | `findByToken` | Present |
| `findByToken_unknownToken_returnsEmpty` | Returns empty for unknown | Nothing saved | `findByToken` | Empty |
| `findByToken_usedToken_stillReturnsIt` | No `used` filter in query — callers validate | Save used token | `findByToken` | Present |
| `findByToken_expiredToken_stillReturnsIt` | No expiry filter in query — callers validate | Save expired token | `findByToken` | Present |
| `invalidateAllByUserId_marksAllUnusedTokensAsUsed` | Bulk update sets `used=true` | Save 2 unused; `em.clear()` | `findAll()` | Both used |
| `invalidateAllByUserId_doesNotAffectAlreadyUsedTokens` | Query targets `used=false` only | Save already-used token | `invalidateAllByUserId` | Still used (idempotent) |
| `invalidateAllByUserId_doesNotAffectOtherUsers` | Scoped to one user | Token for user + token for other user | `invalidateAllByUserId(user)` | Other user's token untouched |
| `invalidateAllByUserId_noTokens_doesNothing` | No-op | Nothing saved | `invalidateAllByUserId` | No exception |
| `save_setsDefaultValues` | Defaults set on save | Build token | `save()` | `id`, `used=false`, timestamps non-null |
| `save_duplicateToken_throwsDataIntegrityViolation` | Unique constraint on `token` | Save a token | `saveAndFlush` same token | `DataIntegrityViolationException` |

---

## Service Tests

> **Setup**: `@ExtendWith(MockitoExtension.class)` — pure unit tests with Mockito mocks.
> All collaborators are mocked. `@BeforeEach` stubs use `lenient()` where the stub is only needed by a subset of tests in the class.

---

### `AuthServiceTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `register_newEmail_savesUserAndReturnsTokens` | Happy path: user saved, access + refresh tokens returned | `existsByEmail=false`; stub save, orgClient, jwtService, refreshTokenService, mapper | `register(request)` | `accessToken`, `refreshToken`, `user`, `organizations` all correct |
| `register_newEmail_publishesUserRegisteredEvent` | `UserRegisteredEvent` is published with correct userId + email | Same as above | `register(request)` | `publishUserRegistered` called; event has correct userId and email |
| `register_newEmail_triggersEmailVerification` | `EmailVerificationService.generateAndSend` is called with the saved user | Same as above | `register(request)` | `emailVerificationService.generateAndSend(savedUser)` invoked |
| `register_emailAlreadyExists_throwsEmailAlreadyExistsException` | Duplicate email is rejected before any save | `existsByEmail=true` | `register(request)` | `EmailAlreadyExistsException`; `save`, `publishUserRegistered`, `generateAndSend` never called |
| `register_noOrganizations_usesNullOrgForToken` | When org-service returns empty list, `generateAccessToken(user, null)` is called | `orgClient` returns `[]` | `register(request)` | `organizations` is empty; `jwtService` called with null org |
| `login_validCredentials_returnsAuthResponse` | Happy path: tokens returned | User found, password matches, active | `login(request)` | `accessToken` and `refreshToken` present |
| `login_validCredentials_updatesLastLoginAtAndPublishesEvent` | `lastLoginAt` is set on user and user is saved; event published | User found, password matches | `login(request)` | `user.lastLoginAt` non-null; `userRepository.save(user)` called; `publishUserLoggedIn` called |
| `login_unknownEmail_throwsBadCredentials` | Unknown email → 401 | `findByEmail` returns empty | `login(request)` | `BadCredentialsException` |
| `login_wrongPassword_throwsBadCredentials` | Wrong password → 401 | `passwordEncoder.matches` returns false | `login(request)` | `BadCredentialsException`; `save` never called |
| `login_inactiveAccount_throwsBadCredentials` | Inactive user cannot log in | User with `active=false`, password matches | `login(request)` | `BadCredentialsException` |
| `refresh_validToken_preservesCurrentOrgContext` | When `currentOrgId` matches a user org, that org is used | `validateRefreshToken` returns token; org list contains `ORG_ID` | `refresh("tok", ORG_ID)` | New access token returned; same refresh token in response |
| `refresh_currentOrgNotInUserOrgs_fallsBackToFirstOrg` | When `currentOrgId` not in org list, fall back to first org | Org list does not contain passed `currentOrgId` | `refresh("tok", unknownId)` | `jwtService.generateAccessToken(user, firstOrg)` called |
| `refresh_nullCurrentOrgId_usesFirstOrg` | Null `currentOrgId` → first org used | Org list has one entry | `refresh("tok", null)` | `jwtService.generateAccessToken(user, firstOrg)` called |
| `refresh_noOrganizations_generatesTokenWithNullOrg` | Empty org list → null org passed to JWT | `orgClient` returns `[]` | `refresh("tok", null)` | `jwtService.generateAccessToken(user, null)` called |
| `logout_delegatesToRefreshTokenService` | Logout simply revokes the refresh token | Nothing | `logout("tok")` | `refreshTokenService.revokeToken("tok")` called |
| `switchOrg_validOrg_updatesCurrentOrgIdAndReturnsToken` | `currentOrgId` updated on user; new JWT generated for that org | User found; org in list | `switchOrg(userId, orgId)` | `accessToken` returned; `user.currentOrgId == orgId`; `userRepository.save` called |
| `switchOrg_orgNotInUserList_generatesTokenWithNullOrg` | Switching to an org the user doesn't belong to generates null-org token | Org list does not contain the requested id | `switchOrg(userId, unknownOrgId)` | `jwtService.generateAccessToken(user, null)` called |
| `switchOrg_userNotFound_throwsUserNotFoundException` | Unknown user id → 404 | `findById` returns empty | `switchOrg(userId, orgId)` | `UserNotFoundException` |

---

### `EmailVerificationServiceTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `generateAndSend_invalidatesExistingTokensForUser` | Old tokens for the user are invalidated before generating new one | Stub `tokenRepository.save` to return arg | `generateAndSend(user)` | `tokenRepository.invalidateAllByUserId(userId)` called |
| `generateAndSend_savesNewTokenWithCorrectExpiry` | New token has correct fields: user, 24 h expiry, not used, non-blank token string | Stub `tokenRepository.save` | `generateAndSend(user)` | Captured token has correct user, `used=false`, expiry ≈ now+24h |
| `generateAndSend_publishesEventWithCorrectData` | Kafka event carries correct userId, email, token, expiresAt | Stub `tokenRepository.save` | `generateAndSend(user)` | `publishEmailVerificationRequested` called; event fields match user |
| `verify_validToken_setsEmailVerifiedAndMarksTokenUsed` | Valid token → `used=true`, `user.emailVerified=true`, both saved | `findByToken` returns unused, non-expired token | `verify("valid-tok")` | `token.used=true`; `user.emailVerified=true`; both repos save called |
| `verify_unknownToken_throwsInvalidTokenException` | Unknown token → exception with "not found" message | `findByToken` returns empty | `verify("bad-tok")` | `InvalidTokenException` containing "not found"; user never saved |
| `verify_alreadyUsedToken_throwsInvalidTokenException` | Used token → exception with "already been used" message | Token with `used=true` | `verify("used-tok")` | `InvalidTokenException` containing "already been used"; user never saved |
| `verify_expiredToken_throwsInvalidTokenException` | Expired token → exception with "expired" message | Token with `expiresAt` in the past | `verify("exp-tok")` | `InvalidTokenException` containing "expired"; user never saved |
| `resendVerification_unverifiedUser_generatesAndSendsNewToken` | Unverified user gets a new verification email | User with `emailVerified=false` | `resendVerification("john@example.com")` | `invalidateAllByUserId` and `save` called; event published |
| `resendVerification_alreadyVerifiedUser_doesNothing` | Already-verified user: no token saved, no event | User with `emailVerified=true` | `resendVerification("john@example.com")` | `tokenRepository.save` and publisher never called |
| `resendVerification_unknownEmail_doesNothingAndDoesNotThrow` | Unknown email silently ignored (prevents enumeration) | `findByEmail` returns empty | `resendVerification("nobody@example.com")` | No exception; `save` and publisher never called |

---

### `PasswordResetServiceTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `requestReset_knownEmail_invalidatesOldTokensAndSavesNew` | Old tokens invalidated; new token saved with 1 h expiry | User found; `save` returns arg | `requestReset("john@example.com")` | `invalidateAllByUserId` called; saved token has correct user, `used=false`, expiry ≈ now+1h |
| `requestReset_knownEmail_publishesEventWithCorrectData` | Kafka event carries userId, email, token, expiresAt | Same as above | `requestReset("john@example.com")` | `publishPasswordResetRequested` called; event fields match user |
| `requestReset_unknownEmail_doesNothingAndDoesNotThrow` | Unknown email silently ignored (prevents enumeration) | `findByEmail` returns empty | `requestReset("nobody@example.com")` | No save, no event, no exception |
| `resetPassword_validToken_updatesPasswordWithPepper` | Password encoded as `newPassword + pepper` and saved to user | Valid token; `encode` returns "new-hashed" | `resetPassword("valid-tok", "NewPassword1!")` | `encode` called with `"NewPassword1!" + PEPPER`; `user.password == "new-hashed"` |
| `resetPassword_validToken_marksTokenUsed` | Token `used` flag is set to true after reset | Valid token | `resetPassword("valid-tok", "NewPassword1!")` | `token.used=true`; `tokenRepository.save(token)` called |
| `resetPassword_validToken_revokesAllRefreshTokens` | All active sessions invalidated after password change | Valid token | `resetPassword("valid-tok", "NewPassword1!")` | `refreshTokenService.revokeAllUserTokens(userId)` called |
| `resetPassword_unknownToken_throwsInvalidTokenException` | Unknown token → exception | `findByToken` returns empty | `resetPassword("bad-tok", "Pass1!")` | `InvalidTokenException` "not found"; user never saved |
| `resetPassword_alreadyUsedToken_throwsInvalidTokenException` | Used token → exception | Token with `used=true` | `resetPassword("used-tok", "Pass1!")` | `InvalidTokenException` "already been used"; no save, no revoke |
| `resetPassword_expiredToken_throwsInvalidTokenException` | Expired token → exception | Token with `expiresAt` in the past | `resetPassword("exp-tok", "Pass1!")` | `InvalidTokenException` "expired"; no save |

---

### `RefreshTokenServiceTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `createRefreshToken_savesTokenWithCorrectFields` | Token is built with correct user, deviceInfo, ipAddress, revoked=false | Stub `save` to return arg | `createRefreshToken(user, "Chrome/Mac", "1.2.3.4")` | Captured token has correct fields |
| `createRefreshToken_expiryIsApproximatelySevenDaysFromNow` | Expiry = `now + refreshTokenExpiration ms` (7 days) | `jwtProperties.refreshTokenExpiration()` = 604 800 000 | `createRefreshToken` | `expiresAt` within ±5 s of `now + 7 days` |
| `createRefreshToken_generatesUniqueTokenStrings` | Each call produces a different UUID token string | Stub `save` to return arg | Call `createRefreshToken` twice | `t1.token != t2.token` |
| `validateRefreshToken_validToken_returnsToken` | Valid token returned as-is | `findByToken` returns active token | `validateRefreshToken("tok")` | Same token instance returned |
| `validateRefreshToken_unknownToken_throwsInvalidTokenException` | Token not in DB → exception | `findByToken` returns empty | `validateRefreshToken("bad")` | `InvalidTokenException` "not found" |
| `validateRefreshToken_revokedToken_throwsInvalidTokenException` | Revoked token → exception | Token with `revoked=true` | `validateRefreshToken("revoked")` | `InvalidTokenException` "revoked" |
| `validateRefreshToken_expiredToken_throwsInvalidTokenException` | Expired token → exception | Token with past `expiresAt` | `validateRefreshToken("expired")` | `InvalidTokenException` "expired" |
| `revokeToken_existingToken_setsRevokedTrue` | `revoked` flag set to true; save called | `findByToken` returns active token | `revokeToken("tok")` | `token.revoked=true`; `save(token)` called |
| `revokeToken_unknownToken_throwsInvalidTokenException` | Unknown token → exception | `findByToken` returns empty | `revokeToken("bad")` | `InvalidTokenException` |
| `getOrCreateActiveToken_activeTokenExists_returnsExisting` | Existing active token returned without saving | `findLatestActiveByUserId` returns a token | `getOrCreateActiveToken(user)` | Existing token returned; `save` never called |
| `getOrCreateActiveToken_noActiveToken_createsNew` | No active token → new one is created and saved | `findLatestActiveByUserId` returns empty | `getOrCreateActiveToken(user)` | New token returned with non-blank string; `save` called |
| `revokeAllUserTokens_delegatesToRepository` | Delegates directly to repository | Nothing | `revokeAllUserTokens(userId)` | `refreshTokenRepository.revokeAllByUserId(userId)` called |

---

### `UserServiceTest`

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `getCurrentUser_existingUser_returnsUserDto` | User found → DTO returned via mapper | `findById` returns user; mapper returns dto | `getCurrentUser(userId)` | Returned dto equals the mapped dto |
| `getCurrentUser_unknownUser_throwsUserNotFoundException` | Unknown id → 404 | `findById` returns empty | `getCurrentUser(userId)` | `UserNotFoundException` |
| `updateCurrentUser_allFieldsProvided_updatesAllAndPublishesEvent` | All three fields updated on user; event has all three in `changedFields` | User found; all fields non-null in request | `updateCurrentUser(userId, request)` | `user.firstName/lastName/avatarUrl` updated; event `changedFields` = `[firstName, lastName, avatarUrl]` |
| `updateCurrentUser_firstNameOnly_onlyFirstNameInChangedFields` | Only the provided field is updated; others unchanged | `firstName` provided, others null | `updateCurrentUser(userId, request)` | `user.firstName` updated; `user.lastName` unchanged; event `changedFields` = `[firstName]` |
| `updateCurrentUser_noFieldsProvided_publishesEventWithEmptyChangedFields` | No fields → event still published but with empty list | All fields null in request | `updateCurrentUser(userId, request)` | Event published; `changedFields` is empty |
| `updateCurrentUser_unknownUser_throwsUserNotFoundException` | Unknown id → 404 | `findById` returns empty | `updateCurrentUser(userId, request)` | `UserNotFoundException`; `save` and publisher never called |
| `updateCurrentUser_avatarUrlOnly_onlyAvatarInChangedFields` | Only avatarUrl provided | `avatarUrl` provided, others null | `updateCurrentUser(userId, request)` | `user.avatarUrl` updated; event `changedFields` = `[avatarUrl]` |

---

### `JwtServiceTest`

> Uses a **real `JwtService` instance** (no mocks). Tokens are parsed with jjwt's `Jwts.parser()` to verify actual JWT content.

| Method | What it tests | Arrange | Act | Assert |
|--------|--------------|---------|-----|--------|
| `generateAccessToken_withOrg_subjectIsUserId` | JWT `sub` claim = `userId.toString()` | User + org | `generateAccessToken(user, org)` | `claims.subject == USER_ID.toString()` |
| `generateAccessToken_withOrg_containsEmailClaim` | `email` claim present with correct value | User + org | `generateAccessToken` | `claims["email"] == "john@example.com"` |
| `generateAccessToken_withOrg_containsSystemRoleClaim` | `systemRole` claim = `"USER"` | User with `SystemRole.USER` | `generateAccessToken` | `claims["systemRole"] == "USER"` |
| `generateAccessToken_withOrg_containsOrgClaims` | `orgId`, `orgRole`, `orgSlug` claims all present | User + org with known values | `generateAccessToken` | All three claims match org DTO fields |
| `generateAccessToken_withOrg_expirationIsApproximately15MinutesFromNow` | Expiry = `now + 900 000 ms` | `accessTokenExpiration = 900 000` | `generateAccessToken` | Seconds until expiry between 890 and 910 |
| `generateAccessToken_withOrg_issuedAtIsSetToNow` | `iat` is within ±1 s of current time | Record time before/after call | `generateAccessToken` | `issuedAt` between `before - 1s` and `after + 1s` |
| `generateAccessToken_nullOrg_doesNotContainOrgClaims` | No org → `orgId`, `orgRole`, `orgSlug` claims are absent | User + null org | `generateAccessToken(user, null)` | All three claims are null |
| `generateAccessToken_nullOrg_stillContainsCoreUserClaims` | Core claims (`sub`, `email`, `systemRole`) still present without org | User + null org | `generateAccessToken(user, null)` | All core claims correct |
| `generateAccessToken_tokenIsSignedAndVerifiable` | Token has a valid signature (parsing succeeds) | Any user | `generateAccessToken` | `Jwts.parser().verifyWith(key)` does not throw |