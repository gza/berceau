````markdown
# Implementation Plan: Platform Authentication

**Branch**: `005-auth` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement passwordless authentication using magic links sent via email. Provide a login UI for requesting magic links, handle token validation and session management, and enable users to log out. This feature enables secure access control for the platform while maintaining simplicity through a proven passwordless pattern. Authorization (roles, permissions) will be added in a future feature.

## Technical Context

**Language/Version**: TypeScript 5.9 (Node.js 20+)  
**Primary Dependencies**: NestJS 11, Prisma 6.17 (PostgreSQL ORM), React 19 (SSR), Nodemailer 7, express-session 1.18  
**Storage**: PostgreSQL via Prisma (existing) - will add User and AuthToken entities; Sessions stored in-memory  
**Testing**: Jest 30 with @nestjs/testing, supertest for integration tests, @testing-library/react for UI components  
**Target Platform**: Linux server (existing Docker Compose setup with PostgreSQL)  
**Project Type**: Web application (NestJS backend with React SSR, single codebase)  
**Performance Goals**: 
- Magic link generation: <100ms p95
- Token validation: <50ms p95
- Session lookup: <10ms p95 (in-memory)
- Email sending: asynchronous (non-blocking to user request)

**Constraints**: 
- Must use existing email infrastructure (Nodemailer from 004-outgoing-email)
- Must follow SSR-only pattern (no client-side JavaScript)
- Must integrate with existing component architecture
- Sessions stored in-memory (MemoryStore) - acceptable for single-instance deployment
- CSRF protection required for state-changing operations
- User seeding via OnModuleInit hook (NestJS lifecycle hook for initial user creation)
- Session regeneration required after successful authentication (prevent session fixation)
- Email addresses normalized to lowercase for storage and lookups
- Default-deny authentication policy (all routes protected except /auth/**)
- One active session per user (new login invalidates previous session)
- HTTPS assumed for production (infrastructure-level, not enforced in code)
- Sessions do NOT bind to IP address or User-Agent (mobile usability)
- Security headers required: CSP, X-Frame-Options, X-Content-Type-Options
- Structured JSON logging for authentication events

**Scale/Scope**: 
- Target: 100-1000 users (small to medium team platform)
- Deployment: single instance (sessions in-memory acceptable)
- Magic link validity: 15 minutes
- Session inactivity timeout: 24 hours
- Session absolute expiration: 7 days maximum
- Rate limit: 5 magic link requests per hour per user
- Token cleanup: Daily background job to delete expired tokens
- User seeding: OnModuleInit hook for creating initial users from environment variables
- User creation: handled via separate registration/invitation flows (not in this feature)
- Authorization: roles and permissions deferred to future feature

**Technology Decisions**:
- **Session Management**: ✅ RESOLVED - express-session with in-memory MemoryStore (see research.md)
- **Token Generation**: ✅ RESOLVED - crypto.randomBytes(32) with base64url encoding (see research.md)
- **Password Hashing**: N/A (passwordless authentication)
- **CSRF Protection**: ✅ RESOLVED - reuse existing implementation unchanged (see research.md)
- **Rate Limiting**: ✅ RESOLVED - in-memory Map-based (see research.md)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Service-Oriented Architecture (Principle I)

**Requirement**: Authentication functionality must be encapsulated in well-defined services organized by domain, with documented and tested APIs.

**Initial Assessment**: ✅ PASS
- Plan to create `AuthService` for authentication operations
- Plan to create `SessionService` for session management  
- Plan to create `UserService` for user entity operations
- All services will be consumable by other components via TypeScript interfaces
- Will follow existing patterns from EmailService and DatabaseModule

**Post-Design Assessment**: ✅ PASS
- Designed AuthService, SessionService, UserService as clean services
- All services injectable via NestJS dependency injection
- TypeScript interfaces defined in contracts/auth-api.ts
- Services consumed via standard NestJS patterns
- Follows existing patterns from EmailService and DatabaseModule
- No global state or configuration affecting other components

---

### Gate 2: UI Server-Side Rendering (Principle II)

**Requirement**: All UI must use server-side rendering with JSX. No client-side JavaScript by default.

**Initial Assessment**: ✅ PASS
- Login page will use SSR (React TSX components)
- Form submission via standard HTML forms (POST requests)
- No client-side JavaScript required for authentication flow
- Magic link handling via server-side GET route
- Follows existing SSR patterns from core/welcome/about pages

**Post-Design Assessment**: ✅ PASS
- LoginPage, MagicLinkSentPage, MagicLinkErrorPage are pure TSX components
- Forms use standard HTML POST with CSRF tokens
- No client-side JavaScript in design
- Magic link verification is server-side GET route
- All UI rendering happens server-side via renderPage()
- Follows existing SSR patterns exactly

---

### Gate 3: Test-Driven Development (Principle IV)

**Requirement**: All features must have comprehensive tests written first (TDD).

**Initial Assessment**: ✅ PASS (commitment)
- Will write unit tests for all services before implementation
- Will write integration tests for authentication flows before implementation
- Will write contract tests for API endpoints before implementation
- Will follow existing test patterns from email and database features

**Post-Design Assessment**: ✅ PASS (commitment maintained)
- Unit tests defined for all services (auth.service.spec.ts, session.service.spec.ts, user.service.spec.ts)
- Integration tests planned for complete flows (magic-link-flow.spec.ts, session-management.spec.ts, rate-limiting.spec.ts)
- Contract tests for API endpoints (auth-api.spec.ts)
- Quickstart.md provides test examples and patterns
- TDD approach documented and ready to execute

---

### Gate 4: Security by Design (Principle V)

**Requirement**: Must consider and mitigate OWASP Top 10 threats. Security as primary consideration.

**Initial Assessment**: ✅ PASS
- Magic links use cryptographically secure tokens
- Rate limiting prevents brute force attacks
- Timing-safe comparison for token validation
- No password storage (passwordless auth eliminates password-related vulnerabilities)
- Sessions have both inactivity and absolute expiration
- CSRF protection integrated for state-changing operations
- Email enumeration prevention (same response for existing/non-existing users)
- Token single-use enforcement
- TLS required for SMTP (existing email infrastructure)
- Input validation for all user inputs

**OWASP Top 10 Coverage**:
1. **A01:2021 Broken Access Control**: Sessions enforce authentication; unauthorized access blocked
2. **A02:2021 Cryptographic Failures**: Secure token generation; TLS for email; sessions encrypted
3. **A03:2021 Injection**: Parameterized Prisma queries; input validation
4. **A04:2021 Insecure Design**: Magic links are time-limited, single-use; rate-limited
5. **A05:2021 Security Misconfiguration**: Environment variables for sensitive config; fail-fast on missing config
6. **A06:2021 Vulnerable Components**: Using maintained dependencies (NestJS 11, Prisma 6, Nodemailer 7)
7. **A07:2021 Identification/Authentication Failures**: Strong token generation; session management; rate limiting
8. **A08:2021 Software/Data Integrity Failures**: N/A for this feature
9. **A09:2021 Security Logging Failures**: All auth attempts logged; failures monitored
10. **A10:2021 SSRF**: N/A for this feature

**Post-Design Assessment**: ✅ PASS (enhanced security)
- Tokens hashed with SHA-256 before database storage (defense in depth)
- crypto.randomBytes(32) provides 256 bits of entropy (exceeds OWASP 128-bit recommendation)
- Timing-safe token comparison via crypto.timingSafeEqual()
- Rate limiting implemented in-memory (5 requests/hour per user)
- Session expiration: both inactivity (24h) and absolute (7 days)
- Cascading deletes ensure no orphaned auth data
- Database indexes prevent table scans (DoS prevention)
- Email enumeration timing-safe (same response time for existing/non-existing users)
- CSRF protection reused from existing implementation
- All security decisions documented in research.md

---

### Gate 5: Simplicity and Minimalism (Principle VI)

**Requirement**: Solutions must be the simplest that satisfy requirements. Justify any new abstractions or dependencies.

**Initial Assessment**: ✅ PASS

**Why not simpler?**
- **Magic links vs passwords**: Magic links chosen for better UX and security (no password storage, reset flows, complexity requirements). Simpler than OAuth which would add external dependencies.
- **In-memory sessions**: Simplest approach using express-session's built-in MemoryStore. No custom Store implementation needed. Sessions lost on restart acceptable for this scale.
- **express-session**: Already a dependency (CSRF protection uses it). Standard, well-tested solution.
- **Prisma entities**: Using existing database infrastructure. No new database system added.
- **Rate limiting**: Essential security requirement, cannot be simpler without compromising security.

**New Dependencies**: NONE (using existing NestJS, Prisma, Nodemailer, express-session)

**New Abstractions**: 
- AuthService, SessionService, UserService (necessary domain services)
- AuthToken entity (required for magic link implementation)
- User entity (core domain entity)
- **Removed**: Session entity (sessions in-memory, not persisted)

**Removal/Rollback Plan**:
- If magic links prove problematic, can add traditional password auth alongside
- Sessions can be moved to Redis/database if multi-instance deployment needed (unlikely at current scale)
- Rate limiting can be disabled via feature flag if causing issues

**Post-Design Assessment**: ✅ PASS (simplicity enhanced - fewer moving parts)
- **Zero new dependencies**: All using existing infrastructure
  - express-session: Already in dependencies
  - crypto: Built-in Node.js module
  - Prisma: Existing database infrastructure
  - Nodemailer: Existing email infrastructure
- **Minimal abstractions**: Only essential domain services
  - 3 services (Auth, Session, User) - each with clear, focused responsibility
  - No unnecessary layers or patterns
  - No repository pattern (direct Prisma access is simpler)
  - No complex ORM abstractions
  - **No custom Store implementation** (MemoryStore built-in)
- **Reused existing patterns**:
  - CSRF protection: Reused completely unchanged
  - Email sending: Reused EmailService
  - Database integration: Reused Prisma component discovery
  - SSR rendering: Reused renderPage infrastructure
- **In-memory rate limiting + sessions**: Simplest solution for current scale
  - No Redis dependency
  - No database Session entity needed
  - No custom session store code
  - Can migrate to persistent sessions later if multi-instance needed without API changes
- **Complexity Score**: 3/10 (was 4/10) - simpler than before due to MemoryStore
- **Standard patterns**: 
  - NestJS guards (standard framework feature)
  - express-session Store interface (standard pattern)
  - Prisma schema (standard ORM)
- **Rejected complex alternatives**:
  - ❌ JWT-only (requires token blacklist, more complex)
  - ❌ Redis sessions (unnecessary infrastructure)
  - ❌ Custom session implementation (reinventing wheel)
  - ❌ nanoid (crypto.randomBytes is simpler, built-in)
  - ❌ bcrypt for tokens (SHA-256 sufficient for high-entropy tokens)

**Complexity Score**: 3/10 (Low)
- 3 new database tables (necessary for domain)
- 3 new services (minimal, focused)
- 1 new guard (standard NestJS pattern)
- 2 decorators (standard NestJS pattern)
- 3 UI pages (standard SSR components)
- 0 new dependencies
- 0 new infrastructure components

**Simplicity Wins**:
- Reused 100% of CSRF infrastructure
- Reused 100% of email infrastructure  
- Reused 100% of database infrastructure
- Reused 100% of SSR infrastructure
- Built-in crypto module instead of new dependency
- In-memory rate limiting instead of Redis
- SHA-256 instead of slow password hashing

---

### Summary

**Initial Assessment**: All constitution gates passed on initial assessment. Key points:
- Uses existing infrastructure and patterns
- No new external dependencies required
- Security-first approach with OWASP coverage
- Follows SSR and service-oriented architecture principles
- TDD approach committed
- Simplicity maintained through reuse of existing patterns

**Post-Design Assessment**: ✅ ALL GATES PASSED

**Design Phase Results**:
- ✅ Service-Oriented Architecture: Clean, injectable services with documented interfaces
- ✅ SSR: Pure TSX components, no client-side JavaScript
- ✅ TDD: Comprehensive test strategy documented and ready
- ✅ Security: Enhanced with token hashing, timing-safe comparisons, defense in depth
- ✅ Simplicity: Zero new dependencies, maximum reuse of existing infrastructure

**Key Achievements**:
1. **Zero New Dependencies**: All using existing project dependencies
2. **Maximum Reuse**: CSRF, email, database, SSR infrastructure all reused unchanged
3. **Enhanced Security**: Token hashing, timing-safe operations, comprehensive OWASP coverage
4. **Clean Architecture**: 3 focused services, standard NestJS patterns
5. **Documented Design**: Complete data model, API contracts, quickstart guide

**Complexity Tracking**: No violations - see Complexity Tracking section

**Action**: ✅ Design phase complete. Ready to proceed to Phase 2 (Implementation Tasks via /speckit.tasks command)

## Project Structure

### Documentation (this feature)

```text
specs/005-auth/
├── spec.md              # Feature specification (existing)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── auth-api.ts      # TypeScript API contracts
│   └── openapi.yaml     # OpenAPI specification (optional)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── systemComponents/
│   └── auth/                        # NEW: Authentication component
│       ├── auth.module.ts           # NestJS module definition
│       ├── services/
│       │   ├── auth.service.ts      # Authentication operations (magic links, token validation)
│       │   ├── session.service.ts   # Session management (create, validate, expire)
│       │   └── user.service.ts      # User CRUD operations
│       ├── controllers/
│       │   ├── auth.controller.ts   # Auth API endpoints (request link, verify, logout)
│       │   └── login.controller.ts  # Login page UI controller
│       ├── guards/
│       │   └── auth.guard.ts        # NestJS guard for protecting routes
│       ├── decorators/
│       │   ├── current-user.ts      # @CurrentUser() decorator
│       │   └── public.ts            # @Public() decorator (skip auth)
│       ├── ui/
│       │   ├── LoginPage.tsx        # Login form page
│       │   ├── MagicLinkSentPage.tsx # Confirmation page
│       │   ├── MagicLinkErrorPage.tsx # Error page
│       │   └── login-page.css       # Styles
│       ├── prisma/
│       │   └── schema.prisma        # User and AuthToken entities (sessions in-memory only)
│       ├── types.ts                 # TypeScript interfaces
│       └── __tests__/
│           ├── auth.service.spec.ts
│           ├── session.service.spec.ts
│           ├── user.service.spec.ts
│           ├── auth.controller.spec.ts
│           ├── auth.guard.spec.ts
│           └── LoginPage.spec.tsx
│
├── database/
│   └── init-scripts/
│       └── init.sh                  # UPDATED: Add session cleanup job (optional)
│
└── app.module.ts                    # UPDATED: Import AuthModule

tests/
├── integration/
│   └── auth/
│       ├── magic-link-flow.spec.ts  # End-to-end magic link test
│       ├── session-management.spec.ts # Session lifecycle tests
│       └── rate-limiting.spec.ts    # Rate limit enforcement tests
└── contract/
    └── auth/
        └── auth-api.spec.ts         # API contract validation

prisma/
└── schema/
    └── auth.prisma                  # AUTO-GENERATED: Copied from src/systemComponents/auth/prisma/schema.prisma
```

**Structure Decision**: Using the existing single-project structure with feature-based organization under `src/systemComponents/`. This follows the established pattern from the email feature (004-outgoing-email) and database integration (002-as-an-end). Authentication is implemented as a system component that can be consumed by other components and user-defined components through the AuthGuard and decorators.

**Key Integration Points**:
1. **Database**: Uses existing Prisma setup; schemas auto-discovered by build process
2. **Email**: Uses existing EmailService from 004-outgoing-email for sending magic links
3. **CSRF**: Integrates with existing CSRF protection from 003-provide-an-easy
4. **SSR**: Uses existing renderPage infrastructure from core systemComponent
5. **Sessions**: Uses express-session (existing dependency) with in-memory MemoryStore

## Complexity Tracking

> **No violations recorded** - All Constitution Check gates passed without exceptions.

If violations are discovered during Phase 1 design, they will be documented here with justification.
