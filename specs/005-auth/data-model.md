# Data Model: Platform Authentication

**Feature**: 005-auth  
**Date**: 2025-10-31  
**Status**: Complete

## Overview

This document defines the database entities, relationships, validation rules, and state transitions for the authentication feature. The design follows Prisma schema conventions and integrates with the existing component-based database architecture.

---

## Entity Diagram

```
┌─────────────────────────────────────┐
│              User                    │
│──────────────────────────────────────│
│ id              String (cuid)        │ PK
│ username        String               │ UNIQUE
│ email           String               │ UNIQUE
│ createdAt       DateTime             │
│ lastLoginAt     DateTime?            │
│──────────────────────────────────────│
│ authTokens      AuthToken[]          │
└─────────────────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────────────────┐
│           AuthToken                  │
│──────────────────────────────────────│
│ id              String (cuid)        │ PK
│ tokenHash       String               │ UNIQUE
│ userId          String               │ FK -> User
│ expiresAt       DateTime             │
│ used            Boolean              │
│ usedAt          DateTime?            │
│ createdAt       DateTime             │
│──────────────────────────────────────│
│ user            User                 │
└─────────────────────────────────────┘

Note: Sessions are stored in-memory via express-session MemoryStore
      (not persisted to database)
```

---

## Prisma Schema

```prisma
// File: src/systemComponents/auth/prisma/schema.prisma
// This file will be auto-discovered and merged by the build process

model User {
  id          String    @id @default(cuid())
  username    String    @unique
  email       String    @unique
  createdAt   DateTime  @default(now())
  lastLoginAt DateTime?

  // Relations
  authTokens AuthToken[]

  @@index([email])
  @@index([username])
  @@map("users")
}

model AuthToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique  // SHA-256 hash of the actual token
  userId    String
  expiresAt DateTime
  used      Boolean   @default(false)
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash, used, expiresAt])
  @@index([userId])
  @@index([expiresAt]) // For cleanup queries
  @@map("auth_tokens")
}

// Note: Session model removed - sessions stored in-memory via express-session
```

---

## Entity Specifications

### User

**Purpose**: Represents a person who can authenticate to the platform

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (cuid) | Primary Key | Auto-generated unique identifier |
| `username` | String | Unique, 3-30 chars, alphanumeric + underscore | User's login name |
| `email` | String | Unique, Valid email format | User's email address for magic links |
| `createdAt` | DateTime | Auto-set | Account creation timestamp |
| `lastLoginAt` | DateTime | Nullable | Most recent successful login |

**Validation Rules** (Service Layer):
```typescript
interface CreateUserInput {
  username: string;  // 3-30 chars, /^[a-zA-Z0-9_]+$/
  email: string;     // Valid email via validator library
}

// Validation
- username: length 3-30, match /^[a-zA-Z0-9_]+$/
- email: RFC 5322 format via validator.isEmail()
- Both username and email must be unique (enforced by DB + service check)
```

**Business Rules**:
1. Username cannot be changed after creation (future: may be relaxed)
2. Email can be changed but must remain unique
3. Soft delete not needed (hard delete on user removal)
4. lastLoginAt updated on every successful magic link verification

**Indexes**:
- `email` (frequent lookup for magic link requests)
- `username` (frequent lookup for login forms)

---

### AuthToken

**Purpose**: Represents a one-time use magic link token for authentication

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (cuid) | Primary Key | Auto-generated unique identifier |
| `tokenHash` | String | Unique | SHA-256 hash of the actual token |
| `userId` | String | Foreign Key -> User | Owner of this token |
| `expiresAt` | DateTime | Required | Token expiration time (15 min from creation) |
| `used` | Boolean | Default: false | Whether token has been consumed |
| `usedAt` | DateTime | Nullable | Timestamp when token was used |
| `createdAt` | DateTime | Auto-set | Token generation timestamp |

**Validation Rules**:
```typescript
interface CreateAuthTokenInput {
  userId: string;     // Must exist in users table
  tokenHash: string;  // 64 char hex string (SHA-256 output)
  expiresAt: Date;    // Must be in future
}

// Validation
- userId: Must reference existing user
- tokenHash: 64 character hex string
- expiresAt: Must be after current time
```

**Business Rules**:
1. Token is valid if: `!used && expiresAt > now()`
2. Token can only be used once (single-use)
3. Using a token sets `used = true` and `usedAt = now()`
4. When new token requested for user, invalidate all previous unused tokens
5. Expired tokens cleaned up by background job (optional optimization)
6. Token hash stored (never plain text token)

**State Transitions**:
```
[Created: used=false, usedAt=null]
    │
    ├─> [Expired: expiresAt < now()] (invalid)
    ├─> [Used: used=true, usedAt=timestamp] (invalid)
    └─> [Valid: used=false, expiresAt > now()] (can be used once)
```

**Indexes**:
- `tokenHash, used, expiresAt` (composite for fast lookup during verification)
- `userId` (for invalidating previous tokens)
- `expiresAt` (for cleanup queries)

**Cascading**: ON DELETE CASCADE (delete tokens when user deleted)

---

## Relationships

### User → AuthToken (1:N)
- One user can have multiple auth tokens (sequential magic link requests)
- Tokens cascade delete when user deleted
- Only one token should be valid at a time (invalidate previous on new request)

### User ↔ Session
- **Sessions are stored in-memory** via express-session MemoryStore
- No database relationship (sessions not persisted)
- Sessions lost on server restart (acceptable trade-off for simplicity)
- Session data includes userId for linking back to User entity

---

## Migration Strategy

### Initial Migration

```prisma
// Generated migration name: 001_create_auth_tables

CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3)
);

CREATE TABLE "auth_tokens" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_username_idx" ON "users"("username");
CREATE INDEX "auth_tokens_tokenHash_used_expiresAt_idx" ON "auth_tokens"("tokenHash", "used", "expiresAt");
CREATE INDEX "auth_tokens_userId_idx" ON "auth_tokens"("userId");
CREATE INDEX "auth_tokens_expiresAt_idx" ON "auth_tokens"("expiresAt");

-- Note: No sessions table - sessions stored in-memory via express-session
```

**User Seeding**: Initial user creation is handled via the AuthModule's `OnModuleInit` lifecycle hook. Set `SEED_USER_USERNAME` and `SEED_USER_EMAIL` environment variables to automatically create an initial user on first startup. The seeding is idempotent and will not create duplicates.

---

## Cleanup Strategy

### Expired Token Cleanup

**Approach**: Scheduled job (e.g., daily cron)

```sql
-- Delete expired or used tokens older than 7 days
DELETE FROM auth_tokens 
WHERE (expiresAt < NOW() OR used = true) 
  AND createdAt < NOW() - INTERVAL '7 days';
```

### Session Cleanup

**Approach**: Automatic via express-session in-memory store

- No database cleanup needed (sessions stored in-memory)
- express-session automatically removes expired sessions from memory
- Sessions lost on server restart (acceptable trade-off)
- No scheduled job required

**Implementation**: Create `CleanupService` in auth module
- `cleanupExpiredTokens()`: Run daily (for AuthToken table only)
- Use NestJS `@Cron()` decorator or simple interval

---

## Security Considerations

1. **Token Storage**: Only hash stored (never plain token)
2. **Cascading Deletes**: Proper cleanup when user deleted
3. **Unique Constraints**: Prevent duplicate usernames/emails at DB level
4. **Indexes**: Enable fast lookups without table scans
5. **Rate Limiting**: Not in schema (handled at application layer)
6. **No PII in session data**: Store only userId, not sensitive fields

---

## Testing Considerations

1. **Unit Tests**: Prisma client mocking for service layer
2. **Integration Tests**: Real database with test data
3. **Schema Tests**: Validate constraints (unique, foreign keys, cascades)
4. **Migration Tests**: Ensure migrations are idempotent

---

## Future Extensions (Out of Scope)

- Email change verification flow (confirmation link)
- Password authentication (alternative to magic links)
- OAuth providers (Google, GitHub, etc.)
- Two-factor authentication (TOTP)
- User profile fields (name, avatar, etc.)
- Account recovery flow (backup emails)
- Session device tracking (user agent, IP)

---

## Summary

This data model provides:
- ✅ Secure token storage (hashed)
- ✅ One-time use magic links with expiration
- ✅ Multi-session support (different devices)
- ✅ Proper cascading deletes
- ✅ Efficient queries via indexes
- ✅ Clean separation of concerns (User, AuthToken, Session)
- ✅ Integration with existing Prisma infrastructure

**Next**: Define API contracts in Phase 1.
