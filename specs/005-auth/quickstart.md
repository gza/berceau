# Authentication Feature - Developer Quickstart

**Feature**: 005-auth  
**Date**: 2025-10-31  
**Audience**: Developers implementing and testing the authentication feature

## Overview

This guide walks you through setting up, implementing, and testing the platform authentication feature. It covers the complete development workflow from environment setup to running tests.

---

## Prerequisites

- Node.js 20+ installed
- PostgreSQL running (via Docker Compose)
- Project dependencies installed (`npm install`)
- Environment variables configured (`.env` file)

---

## Quick Start (5 minutes)

### 1. Start the Database

```bash
# Start PostgreSQL via Docker Compose
npm run docker:up
# OR use VS Code task: "Docker: Compose Up"
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Database connection
DATABASE_URL="postgresql://berceau:berceau@localhost:5432/berceau?schema=public"
MIGRATION_DATABASE_URL="postgresql://berceau:berceau@localhost:5432/berceau?schema=public"

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-secret-key-here"

# Initial user seeding (optional - creates user on first startup if not exists)
# ⚠️ SECURITY WARNING: Use strong, unique credentials. Never use default values in production.
# Production seeding is strongly discouraged. Intended for development/testing only.
SEED_USER_USERNAME="admin"
SEED_USER_EMAIL="admin@example.com"

# Email configuration (for magic links)
# Uses Mailpit for local development (started with Docker Compose)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM_EMAIL="noreply@example.com"
SMTP_FROM_NAME="Platform Auth"
```

**⚠️ Security Notes**:
- Never commit `.env` file to version control
- Use strong, unique values for `SESSION_SECRET` (32+ random bytes)
- User seeding (`SEED_USER_*`) is for development/testing only
- In production, user seeding will log a warning if enabled
- Always use HTTPS in production (infrastructure-level, not enforced in code)

### 3. Run Database Migrations

```bash
# Generate Prisma client and run migrations
npm run build

# Create auth tables migration
npx prisma migrate dev --name create_auth_tables
```

### 4. Start Development Server

```bash
# Start server with hot reload
npm run start:dev
# OR use VS Code task: "Run Dev Server"
```

### 5. Access the Application

- **Application**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Mailpit UI** (view magic link emails): http://localhost:8025

---

## Development Workflow

### Testing Magic Link Flow (Manual)

**Note**: You'll need to create a user first (see "Add First User Manually" section below)

1. **Request Magic Link**:
   - Navigate to http://localhost:3000/login
   - Enter email or username of an existing user
   - Submit form
   - See confirmation: "If the email/username exists, you will receive an email"

2. **Check Email**:
   - Open Mailpit UI: http://localhost:8025
   - Find magic link email
   - Copy magic link URL

3. **Verify Magic Link**:
   - Click link or paste in browser
   - Should redirect to dashboard (authenticated)

4. **Verify Session**:
   - Check session: `curl http://localhost:3000/auth/session`
   - Should return authenticated user info

5. **Logout**:
   - Click logout button or POST to `/auth/logout` with CSRF token
   - Session destroyed, redirected to login

---

## Running Tests

### All Tests

```bash
# Run all tests (unit + integration)
npm test
```

### Unit Tests Only

```bash
# Run unit tests for auth services
npm test -- auth.service.spec
npm test -- session.service.spec
npm test -- user.service.spec
```

### Integration Tests

```bash
# Run auth integration tests
npm test -- integration/auth
```

### Test Coverage

```bash
# Generate coverage report
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

---

## Project Structure (Auth Feature)

```
src/systemComponents/auth/
├── auth.module.ts              # NestJS module (imports, providers, exports)
├── services/
│   ├── auth.service.ts         # Magic link generation and verification
│   ├── session.service.ts      # Session management (CRUD, cleanup)
│   └── user.service.ts         # User CRUD operations
├── controllers/
│   ├── auth.controller.ts      # API endpoints (/auth/*)
│   └── login.controller.ts     # Login page UI (/login)
├── guards/
│   └── auth.guard.ts           # Route protection (check session)
├── decorators/
│   ├── current-user.ts         # @CurrentUser() - inject user from session
│   └── public.ts               # @Public() - skip authentication
├── ui/
│   ├── LoginPage.tsx           # Login form
│   ├── MagicLinkSentPage.tsx  # Confirmation page
│   ├── MagicLinkErrorPage.tsx # Error page
│   └── login-page.css          # Styles
├── prisma/
│   └── schema.prisma           # User, AuthToken models (no Session model)
└── __tests__/
    ├── auth.service.spec.ts    # Unit tests
    ├── session.service.spec.ts
    └── user.service.spec.ts
```

---

## Key Implementation Files

### 1. Auth Service (`services/auth.service.ts`)

**Responsibilities**:
- Generate magic link tokens (crypto.randomBytes)
- Hash tokens for database storage (SHA-256)
- Verify tokens (timing-safe comparison)
- Invalidate previous unused tokens
- Send magic link emails (via EmailService)
- Rate limiting (in-memory)

**Key Methods**:
```typescript
async requestMagicLink(identifier: string): Promise<void>
async verifyMagicLink(token: string): Promise<User | null>
checkRateLimit(identifier: string): boolean
```

### 2. Session Service (`services/session.service.ts`)

**Responsibilities**:
- Wrap express-session operations with service interface
- Session data stored in-memory via MemoryStore (built-in)
- Handle session operations (get, touch, destroy)
- **Note**: No custom Store implementation needed; no Prisma session storage

**Key Methods**:
```typescript
async createSession(userId: string): Promise<string>  // Wrapper around req.session
async getSession(sessionId: string): Promise<SessionData | null>
async touchSession(sessionId: string): Promise<void>
async destroySession(sessionId: string): Promise<void>
// cleanupExpiredSessions() - automatic via express-session, no manual cleanup needed
```

**Implementation Note**: 
This is a thin wrapper over express-session to provide consistent service interface. Actual session storage handled by express-session's built-in MemoryStore.

### 3. User Service (`services/user.service.ts`)

**Responsibilities**:
- Find users by email or username
- Update last login timestamp
- User management operations

**Key Methods**:
```typescript
async findByIdentifier(identifier: string): Promise<User | null>
async findById(userId: string): Promise<User | null>
async updateLastLogin(userId: string): Promise<void>
```

### 4. Auth Guard (`guards/auth.guard.ts`)

**Responsibilities**:
- Check if user has valid session
- Inject user into request object
- Allow public routes (via @Public() decorator)
- Redirect unauthenticated users to login

**Usage**:
```typescript
// Protected route (default)
@Get('dashboard')
getDashboard(@Request() req) {
  return `Welcome ${req.user.username}`;
}

// Public route (skip authentication)
@Public()
@Get('about')
getAbout() {
  return 'Public page';
}
```

---

## Common Development Tasks

### User Seeding via OnModuleInit

The auth module uses NestJS `OnModuleInit` lifecycle hook to seed initial users from environment variables:

```typescript
// In auth.module.ts
@Module({
  // ...
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

  async onModuleInit() {
    // Seed initial user if environment variables are set
    const seedUsername = process.env.SEED_USER_USERNAME;
    const seedEmail = process.env.SEED_USER_EMAIL;

    if (seedUsername && seedEmail) {
      const existingUser = await this.userService.findByIdentifier(seedEmail);
      
      if (!existingUser) {
        await this.userService.create({
          username: seedUsername,
          email: seedEmail
        });
        console.log(`Seeded initial user: ${seedUsername}`);
      }
    }
  }
}
```

**Environment Variables:**
- `SEED_USER_USERNAME` - Username for initial user (optional)
- `SEED_USER_EMAIL` - Email for initial user (optional)

**Behavior:**
- Only creates user if both environment variables are set
- Idempotent: Won't create duplicate if user already exists
- Runs on every application startup (but checks for existing user first)
- Silent if environment variables not provided

### Add Users Manually (Alternative)

```typescript
// Run in Prisma Studio or via script
await prisma.user.create({
  data: {
    username: 'testuser',
    email: 'test@example.com'
  }
});
```

**Note**: Once authentication is implemented, user creation will be handled through proper registration/invitation flows. Authorization (roles, permissions) will be added in a future feature.

### View Active Sessions (In-Memory)

**Note**: Sessions are stored in-memory and not accessible via database queries. To debug sessions:
- Use SessionService methods to query session state
- Check express-session logs
- Inspect req.session object in controllers/guards
- Sessions lost on server restart (expected behavior)

### Check Auth Tokens in Database

```sql
-- View all tokens
SELECT id, "userId", used, "expiresAt", "createdAt"
FROM auth_tokens;

-- Find valid tokens for user
SELECT * FROM auth_tokens 
WHERE "userId" = 'cuid_here' 
  AND used = false 
  AND "expiresAt" > NOW();
```

### Cleanup Expired Data

```typescript
// Call cleanup service methods
await sessionService.cleanupExpiredSessions();
await authService.cleanupExpiredTokens();
```

---

## Testing Scenarios

### 1. Magic Link Flow

**Test**: Complete authentication flow

```typescript
// integration/auth/magic-link-flow.spec.ts
it('should authenticate user with valid magic link', async () => {
  // Request magic link
  const response = await request(app.getHttpServer())
    .post('/auth/request-magic-link')
    .send({ identifier: 'admin@example.com', _csrf: csrfToken })
    .expect(200);
  
  // Get token from email (Mailpit)
  const email = await mailpitClient.getLatestEmail();
  const token = extractTokenFromEmail(email.body);
  
  // Verify token
  const verifyResponse = await request(app.getHttpServer())
    .get(`/auth/verify/${token}`)
    .expect(302); // Redirect to dashboard
  
  // Check session created
  const cookies = verifyResponse.headers['set-cookie'];
  const sessionCookie = cookies.find(c => c.startsWith('connect.sid'));
  expect(sessionCookie).toBeDefined();
});
```

### 2. Rate Limiting

**Test**: Enforce rate limits

```typescript
// integration/auth/rate-limiting.spec.ts
it('should block magic link requests after rate limit exceeded', async () => {
  const identifier = 'test@example.com';
  
  // Make 5 requests (allowed)
  for (let i = 0; i < 5; i++) {
    await request(app.getHttpServer())
      .post('/auth/request-magic-link')
      .send({ identifier, _csrf: csrfToken })
      .expect(200);
  }
  
  // 6th request should fail
  await request(app.getHttpServer())
    .post('/auth/request-magic-link')
    .send({ identifier, _csrf: csrfToken })
    .expect(429); // Too Many Requests
});
```

### 3. Session Expiration

**Test**: Sessions expire after inactivity

```typescript
// integration/auth/session-management.spec.ts
it('should expire session after 24 hours of inactivity', async () => {
  const sessionId = await sessionService.createSession(userId);
  
  // Fast-forward time (mock Date.now)
  jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours
  
  const session = await sessionService.getSession(sessionId);
  expect(session).toBeNull(); // Expired
});
```

---

## Debugging Tips

### 1. View Session Data

```typescript
// In controller or service
console.log('Session:', req.session);
console.log('User:', req.user);
console.log('Session ID:', req.sessionID);
```

### 2. View Magic Link Emails

Open Mailpit UI: http://localhost:8025
- All outgoing emails captured
- View HTML/text content
- Click links directly from UI

### 3. Check Rate Limit State

```typescript
// In auth.service.ts, add logging
checkRateLimit(identifier: string): boolean {
  const record = this.rateLimiter.get(identifier);
  this.logger.debug(`Rate limit for ${identifier}:`, record);
  return this.rateLimiter.checkLimit(identifier);
}
```

### 4. Enable Debug Logging

```bash
# In .env
LOG_LEVEL=debug

# Or in code
this.logger.debug('Token generated:', { tokenHash, expiresAt });
```

---

## Troubleshooting

### Problem: Admin user not created on startup

**Solution**: Check environment variables

```bash
# Ensure these are set in .env
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@example.com"

# Restart server
npm run start:dev
```

### Problem: Magic link emails not received

**Solution**: Check Mailpit is running

```bash
# Check Docker containers
docker compose ps

# Should see mailpit running on port 1025/8025

# Check Mailpit UI
open http://localhost:8025
```

### Problem: CSRF token errors

**Solution**: Ensure session middleware is configured

```typescript
// main.ts should have
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // MemoryStore used by default (no store option needed)
}));
```

### Problem: Sessions lost after server restart

**Expected Behavior**: Sessions are stored in-memory and will be lost on restart.

**Solution**: This is by design. Users will need to request a new magic link after server restart. If persistent sessions are needed:
1. Implement custom Prisma session store
2. Or use Redis for session storage
3. Update express-session configuration with custom store

---

## Performance Tips

### 1. Index Usage

Ensure indexes are created by migration:
- `users(email)` - Fast login lookup
- `auth_tokens(tokenHash, used, expiresAt)` - Fast token verification

### 2. Session Cleanup

**No cleanup needed** - express-session MemoryStore handles cleanup automatically. Sessions expire based on cookie maxAge setting (24 hours).

```typescript
// In auth.module.ts
@Cron('0 * * * *') // Every hour
async cleanupSessions() {
  const deleted = await this.sessionService.cleanupExpiredSessions();
  this.logger.log(`Cleaned up ${deleted} expired sessions`);
}
```

### 3. Rate Limiter Memory Management

In-memory rate limiter auto-cleans expired records:

```typescript
// Automatic cleanup on each check
checkLimit(identifier: string): boolean {
  this.cleanupExpiredRecords(); // Called internally
  // ...
}
```

---

## Next Steps

1. **Implement Services**: Start with UserService, then AuthService, then SessionService
2. **Write Unit Tests**: TDD approach - write tests first
3. **Implement Controllers**: API endpoints and UI routes
4. **Write Integration Tests**: Test complete flows
5. **Implement Guards**: AuthGuard for route protection
6. **Add UI Components**: Login page, confirmation pages
7. **Test Manually**: Use Mailpit to verify email flows

---

## Additional Resources

- [Feature Spec](./spec.md) - Requirements and user scenarios
- [Data Model](./data-model.md) - Database schema and entities
- [API Contracts](./contracts/auth-api.ts) - TypeScript interfaces
- [Research](./research.md) - Technical decisions and rationale
- [Implementation Plan](./plan.md) - Overall architecture and structure

---

## Support

For questions or issues:
1. Check existing tests for examples
2. Review implementation docs in `docs/implementation_doc/`
3. Consult feature spec for requirements clarification
