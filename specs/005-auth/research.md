# Authentication Feature Research

**Feature**: Platform Authentication (005-auth)  
**Date**: 2025-10-31  
**Status**: Complete

## Purpose

This document resolves all "NEEDS CLARIFICATION" items identified in the Technical Context section of plan.md through research and technical decision-making. Each decision is documented with rationale, alternatives considered, and implementation approach.

---

## Research Items

### 1. Session Management Strategy

**Question**: Research express-session with Prisma store vs custom implementation

**Decision**: Use **express-session with in-memory MemoryStore**

**Rationale**:
- express-session is already a project dependency (v1.18.2)
- Well-tested, industry-standard solution with 10+ years of production use
- Follows existing pattern (CSRF protection already uses express-session)
- **In-memory storage is acceptable for this scale and use case**:
  - Target deployment: single instance (100-1000 users)
  - Sessions lost on restart are acceptable (user just requests new magic link)
  - Magic link tokens remain valid after restart (stored in database)
  - Simpler than custom Prisma store implementation
  - Zero additional code complexity

**Alternatives Considered**:
1. **Database-backed sessions (Prisma custom store)**: 
   - ❌ Rejected: Adds implementation complexity (custom Store class)
   - OWASP recommends for "better security" (prevents replay attacks)
   - However, for our scale and single-instance deployment, the complexity cost outweighs benefit
   - Session replay attacks mitigated by: short session lifetime (24h inactivity), CSRF protection, HTTPS-only cookies
   
2. **Redis-backed sessions**: 
   - ❌ Rejected: Adds new infrastructure dependency (Redis server)
   - Increases operational complexity
   - Current scale (100-1000 users) doesn't justify Redis overhead
   
3. **JWT-only (no sessions)**:
   - ❌ Rejected: Cannot invalidate tokens before expiration
   - Logout becomes problematic (requires token blacklist)
   - Larger token size (sent with every request)
   - Conflicts with existing CSRF protection that depends on sessions

4. **Custom session implementation from scratch**:
   - ❌ Rejected: Violates "simplicity and minimalism" principle
   - Reinventing well-tested solution
   - More attack surface, potential security vulnerabilities

**Implementation Approach**:
- Use express-session's default MemoryStore (built-in, no configuration needed)
- Session configuration via NestJS middleware:
  ```typescript
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  ```
- No custom store implementation needed
- No database Session entity needed
- Session cleanup automatic (handled by express-session)

**OWASP Alignment**:
- ✅ HttpOnly cookies (prevents XSS access)
- ✅ Secure flag in production (HTTPS-only)
- ✅ SameSite=lax (CSRF protection)
- ✅ Session expiration (24h inactivity timeout)
- ⚠️  In-memory storage: OWASP prefers database-backed for multi-instance and replay attack prevention
  - **Mitigation**: Single-instance deployment, CSRF protection, short session lifetime, HTTPS-only
  - **Trade-off accepted**: Simplicity > theoretical multi-instance support at this scale
  - **OWASP Context**: "Switch to a database-based session store for better security" (Rails Cheat Sheet)
    - Primary concern: Session replay attacks in multi-instance deployments
    - Secondary concern: Session persistence across restarts
  - **Risk Assessment for Our Context**:
    - ✅ Single-instance deployment (no multi-instance session sharing needed)
    - ✅ Short session lifetime (24h) limits replay attack window
    - ✅ CSRF protection via Synchronizer Token Pattern (existing)
    - ✅ HTTPS-only in production (prevents session hijacking via network sniffing)
    - ✅ HttpOnly + SameSite cookies (prevents XSS and CSRF session theft)
    - ✅ Magic links remain valid after restart (stored in database)
    - ✅ User impact minimal: Just request new magic link after restart
    - **Conclusion**: In-memory sessions acceptable for single-instance deployment at 100-1000 user scale

**References**:
- express-session docs: MemoryStore documentation
- OWASP Session Management Cheat Sheet
- OWASP Rails Cheat Sheet (database-backed sessions recommendation)
- NestJS session documentation
- Existing CSRF implementation (uses express-session)

---

### 2. Token Generation for Magic Links

**Question**: Research crypto.randomBytes vs UUID vs nanoid for magic link tokens

**Decision**: Use **crypto.randomBytes(32).toString('base64url')**

**Rationale**:
- Built-in Node.js crypto module (no new dependencies)
- Cryptographically secure random number generator (CSPRNG)
- 32 bytes = 256 bits of entropy (exceeds OWASP recommendation of 128 bits)
- Base64url encoding is URL-safe (safe for email links, no escaping needed)
- Timing-safe comparison available via `crypto.timingSafeEqual()`

**Entropy Calculation**:
- 32 bytes = 256 bits of entropy
- Search space: 2^256 ≈ 10^77 possible tokens
- At 1 million attempts per second: 10^64 years to brute force
- Far exceeds security requirements

**Alternatives Considered**:
1. **UUID v4 (random)**:
   - ❌ Rejected: Only 122 bits of entropy (some bits reserved for version/variant)
   - Less entropy than crypto.randomBytes(32)
   - Still acceptable but not optimal
   
2. **nanoid**:
   - ❌ Rejected: Requires additional npm dependency
   - Violates "simplicity and minimalism" principle
   - crypto.randomBytes provides equivalent security without dependency

3. **JWT signed tokens**:
   - ❌ Rejected: Overhead of signing/verification
   - Tokens are single-use and short-lived (15 min), signature adds no value
   - Stored in database anyway, no benefit over random token

**Implementation Approach**:
```typescript
import { randomBytes } from 'crypto';

function generateMagicLinkToken(): string {
  // 32 bytes = 256 bits of entropy
  return randomBytes(32).toString('base64url');
}
```

**Validation**:
- Store hashed version in database (SHA-256)
- Compare using `crypto.timingSafeEqual()` to prevent timing attacks
- Single-use enforcement via database state (used/unused)
- Expiration via timestamp comparison

**References**:
- Node.js crypto.randomBytes documentation
- OWASP Session Management Cheat Sheet (recommends 128+ bits)
- RFC 4648 (base64url encoding)

---

### 3. CSRF Protection Integration

**Question**: Research integration with existing CSRF implementation (003-provide-an-easy)

**Decision**: **Reuse existing CSRF infrastructure with no modifications needed**

**Rationale**:
- Existing CSRF protection (from 003-provide-an-easy) already handles all our needs
- Uses Synchronizer Token Pattern (OWASP recommended)
- Global guard already applies to POST/PUT/DELETE/PATCH methods
- `@SkipCsrf()` decorator available for API endpoints (magic link verification)
- `<CsrfToken />` component already available for forms
- Session-based token storage (aligns with our session management)

**Integration Points**:
1. **Login Form**: Include `<CsrfToken />` component in login form submission
2. **Logout Endpoint**: POST request with CSRF token
3. **Magic Link Request**: POST endpoint requires CSRF token
4. **Magic Link Verification**: GET endpoint (no CSRF needed, token in URL)

**No Changes Required**:
- Existing CsrfGuard works perfectly for authentication endpoints
- AsyncLocalStorage integration allows session access in JSX components
- No new CSRF logic needed

**Implementation Approach**:
```tsx
// Login form (SSR)
<form method="POST" action="/auth/request-magic-link">
  <CsrfToken />  {/* Reuse existing component */}
  <input name="email" type="email" />
  <button type="submit">Send Magic Link</button>
</form>
```

**Endpoints and CSRF Requirements**:
- `POST /auth/request-magic-link` - ✅ Requires CSRF token
- `GET /auth/verify/:token` - ❌ No CSRF (token in URL, one-time use)
- `POST /auth/logout` - ✅ Requires CSRF token
- `GET /auth/login` - ❌ No CSRF (renders form, GET request)

**References**:
- docs/implementation_doc/CSRF_PROTECTION_IMPLEMENTATION.md
- Existing CsrfService, CsrfGuard, CsrfToken component

---

### 4. Rate Limiting Implementation

**Question**: Research in-memory vs Redis vs database-based rate limiting for magic link requests

**Decision**: Use **in-memory rate limiting with simple Map-based store**

**Rationale**:
- Simple requirement: 5 requests per hour per user
- Low traffic expected (100-1000 users, not all logging in simultaneously)
- In-memory tracking sufficient for single-instance deployment
- No new dependencies required
- Easy to implement and test

**Scale Considerations**:
- Current scale: 100-1000 users
- Peak scenario: 10% users (100) request magic link in 1 hour = 100 requests
- Memory usage: ~50KB for tracking (negligible)
- Multi-instance: Initial deployment is single instance
- Future: Can migrate to Redis if needed without changing API

**Alternatives Considered**:
1. **Redis-based rate limiting**:
   - ❌ Rejected: Adds infrastructure dependency
   - Overkill for current scale
   - Complexity not justified
   
2. **Database-based rate limiting**:
   - ❌ Rejected: Adds database load for every request
   - Requires schema for rate limit tracking
   - Slower than in-memory
   - Not necessary at current scale

3. **express-rate-limit middleware**:
   - ❌ Rejected: General-purpose, IP-based rate limiting
   - We need user-specific rate limiting (by email/username)
   - Still requires store implementation

**Implementation Approach**:
```typescript
// Simple in-memory rate limiter
class MagicLinkRateLimiter {
  private attempts = new Map<string, { count: number; resetAt: Date }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // Clean up expired records
    if (record && now > record.resetAt.getTime()) {
      this.attempts.delete(identifier);
      return true;
    }

    if (!record || record.count < this.maxAttempts) {
      const newCount = (record?.count || 0) + 1;
      this.attempts.set(identifier, {
        count: newCount,
        resetAt: record?.resetAt || new Date(now + this.windowMs)
      });
      return true;
    }

    return false; // Rate limit exceeded
  }
}
```

**Features**:
- Automatic cleanup of expired records
- Per-user tracking (keyed by email)
- Configurable limits via environment variables
- Memory-efficient (only stores active limiters)

**Migration Path**:
- If Redis needed later, create `RedisRateLimiter` implementing same interface
- Swap implementation without changing service logic
- Feature flag to enable Redis vs in-memory

**References**:
- OWASP Authentication Cheat Sheet (rate limiting section)
- NestJS rate limiting techniques

---

### 5. Token Storage and Security

**Question**: Determine secure token storage approach (plain vs hashed)

**Decision**: Store **hashed tokens using SHA-256** in database

**Rationale**:
- Defense in depth: If database compromised, tokens cannot be used
- SHA-256 is fast enough for our use case (<1ms per hash)
- Tokens are high-entropy random values (not passwords needing slow hash)
- Aligns with security best practices for API tokens

**Alternatives Considered**:
1. **Plain text tokens**:
   - ❌ Rejected: Security risk if database exposed
   - Tokens in database backup could be exploited
   - Violates "Security by Design" principle
   
2. **bcrypt/scrypt (slow hashing)**:
   - ❌ Rejected: Overkill for high-entropy random tokens
   - Designed for passwords (low entropy, user-chosen)
   - Slower than needed (100ms+ per hash)
   - SHA-256 sufficient for random tokens

**Implementation Approach**:
```typescript
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// When generating magic link
const token = generateMagicLinkToken(); // Random token
const hashedToken = hashToken(token);
await prisma.authToken.create({
  data: {
    tokenHash: hashedToken, // Store hash only
    userId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  }
});
// Send token in email (not stored anywhere)

// When verifying magic link
const providedToken = req.params.token;
const providedTokenHash = hashToken(providedToken);
const dbToken = await prisma.authToken.findFirst({
  where: { tokenHash: providedTokenHash, used: false }
});
```

**Security Properties**:
- Token never stored in plain text
- Database compromise doesn't expose valid tokens
- Fast enough for real-time verification
- Standard cryptographic hash function

**References**:
- OWASP Cryptographic Storage Cheat Sheet
- Node.js crypto.createHash documentation

---

## 6. Additional Security Decisions

**Question**: Address remaining security model decisions before implementation

**Decisions Made**:

### 6.1 Session Fixation Prevention
**Decision**: Regenerate session ID after successful authentication

**Rationale**:
- Prevents session fixation attacks (CWE-384)
- Standard security practice for authentication systems
- express-session provides `req.session.regenerate()` method
- Minimal overhead (~1ms per login)

**Implementation**:
```typescript
// After successful magic link verification
await req.session.regenerate((err) => {
  if (err) throw err;
  req.session.userId = user.id;
  // Continue with redirect
});
```

### 6.2 Email Address Normalization
**Decision**: Normalize email addresses to lowercase for storage and lookups

**Rationale**:
- Prevents duplicate accounts: "User@Example.com" vs "user@example.com"
- Email addresses are case-insensitive per RFC 5321 (local-part is technically case-sensitive, but universally treated as case-insensitive)
- Consistent user experience
- Industry standard practice

**Implementation**:
```typescript
const normalizedEmail = email.toLowerCase().trim();
```

### 6.3 Username Case Sensitivity
**Decision**: Usernames are case-sensitive

**Rationale**:
- Allows more username flexibility ("Alice" vs "alice")
- Common practice in modern platforms (GitHub, Twitter)
- No security benefit to case-insensitive usernames
- Explicit uniqueness constraint handles duplicates

### 6.4 Session Concurrency Policy
**Decision**: One active session per user; new login invalidates previous session

**Rationale**:
- Simplifies session management
- Prevents session confusion
- User can always re-authenticate if needed
- Aligns with in-memory session storage (no cross-device session tracking needed)

**Implementation**: express-session with userId as session key naturally handles this

### 6.5 Rate Limit Error Response
**Decision**: HTTP 429 with generic message "Too many requests. Please try again later."

**Rationale**:
- Standard HTTP status for rate limiting
- Generic message prevents enumeration
- No specific timing information revealed
- Client can implement exponential backoff

### 6.6 Protected Resource Policy
**Decision**: Default-deny authentication; all routes protected except `/auth/**`

**Rationale**:
- Security by default (fail-safe)
- Explicit opt-out via `@Public()` decorator
- Prevents accidental exposure of protected resources
- Standard NestJS pattern with global guards

**Implementation**:
```typescript
// Global guard in main.ts
app.useGlobalGuards(new AuthGuard());

// Public routes use decorator
@Public()
@Get('/auth/login')
```

### 6.7 User Seeding Security
**Decision**: Warn if SEED_USER_* environment variables present in production

**Rationale**:
- Development/testing convenience vs production security
- Logging warning makes risk explicit
- Doesn't prevent (operations team may need emergency access)
- Documentation clearly states "dev/test only"

**Implementation**:
```typescript
if (process.env.NODE_ENV === 'production' && process.env.SEED_USER_EMAIL) {
  logger.warn('User seeding enabled in production environment. This is intended for development/testing only.');
}
```

**References**:
- OWASP Session Management Cheat Sheet (session fixation)
- RFC 5321 (email case sensitivity)
- CWE-384 (Session Fixation)

### 6.8 Session Binding to IP/User-Agent
**Decision**: Do NOT bind sessions to IP address or User-Agent string

**Rationale**:
- Mobile users frequently change IP addresses (cell tower handoffs, WiFi switching)
- Corporate proxies cause IP changes
- User-Agent binding breaks browser updates
- Minimal security benefit with HTTPS + HttpOnly + SameSite cookies
- Adds implementation complexity
- Poor user experience (unnecessary re-authentication)

**Trade-off accepted**: Theoretical session hijacking risk on local network vs usability
- Mitigated by: HTTPS (prevents network sniffing), HttpOnly cookies (prevents XSS theft)

### 6.9 Absolute Session Expiration
**Decision**: Sessions expire after 7 days maximum, regardless of activity

**Rationale**:
- Defense in depth: prevents indefinitely active sessions
- Compliance-friendly (periodic re-authentication)
- Reasonable balance: 7 days allows weekly usage without disruption
- Combined with 24h inactivity timeout (FR-014)
- Industry standard for web applications

**Implementation**:
```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days absolute
  // Note: express-session also checks last activity for inactivity timeout
}
```

### 6.10 Token Cleanup Strategy
**Decision**: Daily background job to delete expired tokens

**Rationale**:
- Prevents database bloat (tokens accumulate over time)
- Tokens are already unusable after expiration (checked in validation)
- Low-frequency job sufficient (daily cleanup is adequate)
- No user impact (expired tokens are invalid regardless)
- Simple implementation using NestJS scheduler

**Implementation**:
```typescript
@Cron('0 0 * * *') // Daily at midnight
async cleanupExpiredTokens() {
  await prisma.authToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
}
```

### 6.11 XSS Prevention Headers
**Decision**: Set security headers for defense-in-depth

**Rationale**:
- **Content-Security-Policy**: `default-src 'self'` prevents inline scripts, external resources
- **X-Frame-Options**: `DENY` prevents clickjacking
- **X-Content-Type-Options**: `nosniff` prevents MIME-type sniffing attacks
- React already escapes JSX by default, headers add extra layer
- Industry best practice (OWASP recommended)
- Minimal performance impact

**Implementation**: Use helmet middleware or manual headers

### 6.12 Structured Logging Format
**Decision**: JSON structured logs for authentication events

**Rationale**:
- Machine-parseable for log aggregation tools
- Consistent format enables automated monitoring/alerting
- Security audit trail requirements
- Standard fields: timestamp, level, userId, action, outcome, ipAddress
- Facilitates incident response and forensics

**Implementation**:
```typescript
logger.log({
  timestamp: new Date().toISOString(),
  level: 'info',
  userId: user.id,
  action: 'magic_link_requested',
  outcome: 'success',
  ipAddress: req.ip
});
```

**References**:
- OWASP Logging Cheat Sheet
- CWE-778 (Insufficient Logging)

---

## Summary of Decisions

| Item | Decision | Primary Reason | Dependencies Added |
|------|----------|----------------|-------------------|
| Session Management | express-session + in-memory MemoryStore | Existing dependency, sufficient for scale | None |
| Token Generation | crypto.randomBytes(32) | Built-in, cryptographically secure | None |
| CSRF Protection | Reuse existing implementation | Already handles all cases | None |
| Rate Limiting | In-memory Map-based | Sufficient for scale, no dependencies | None |
| Token Storage | SHA-256 hashing | Defense in depth, fast enough | None |
| Session Fixation | Regenerate session ID after auth | Prevent CWE-384, standard practice | None |
| Email Normalization | Lowercase normalization | Prevent duplicates, RFC 5321 aligned | None |
| Username Case | Case-sensitive | User flexibility, no security benefit to insensitive | None |
| Session Concurrency | One session per user | Simplifies management, aligns with in-memory | None |
| Rate Limit Response | HTTP 429 with generic message | Standard, prevents enumeration | None |
| Auth Policy | Default-deny with @Public() decorator | Security by default, explicit opt-out | None |
| User Seeding | Warn in production | Dev convenience, production awareness | None |
| Session Binding | Do NOT bind to IP/User-Agent | Mobile usability, minimal security gain | None |
| Absolute Session Expiry | 7 days maximum | Compliance, defense in depth | None |
| Token Cleanup | Daily background job | Prevent database bloat, simple | None |
| XSS Headers | CSP, X-Frame-Options, nosniff | Defense-in-depth, OWASP best practice | None |
| Log Format | JSON structured logs | Machine-parseable, audit trail | None |

**Constitution Compliance**:
- ✅ Simplicity: No new dependencies added
- ✅ Security: Defense in depth, cryptographic best practices
- ✅ Service-Oriented: Clean interfaces, reusable components
- ✅ Testability: All approaches easily unit testable

**Next Steps**: Proceed to Phase 1 (Design) with these technical decisions as foundation.
