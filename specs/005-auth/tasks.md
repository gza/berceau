---
description: "Task list for Platform Authentication implementation"
---

# Tasks: Platform Authentication

**Input**: Design documents from `/specs/005-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.ts, quickstart.md

**Tests**: This feature includes comprehensive TDD approach with unit, integration, and contract tests as specified in plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and initialize authentication component

- [ ] T001 Create auth component directory structure at src/systemComponents/auth/
- [ ] T002 [P] Create TypeScript types file at src/systemComponents/auth/types.ts with User and AuthToken interfaces
- [ ] T003 [P] Create Prisma schema file at src/systemComponents/auth/prisma/schema.prisma with User and AuthToken models
- [ ] T004 Generate Prisma client and create migration for auth tables using `npx prisma migrate dev --name create_auth_tables`
- [ ] T005 Configure environment variables for SESSION_SECRET, SEED_USER_USERNAME, SEED_USER_EMAIL in .env file

**Checkpoint**: Basic structure ready, database schema created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Implement UserService at src/systemComponents/auth/services/user.service.ts with CRUD operations, user lookup by email/username, email normalization to lowercase (FR-022), and case-sensitive username handling (FR-023)
- [ ] T007 [P] Implement SessionService at src/systemComponents/auth/services/session.service.ts with create, validate, destroy, invalidate old sessions (FR-026), and cleanup methods
- [ ] T008 [P] Create @CurrentUser() decorator at src/systemComponents/auth/decorators/current-user.ts for extracting user from request
- [ ] T009 [P] Create @Public() decorator at src/systemComponents/auth/decorators/public.ts for marking routes as public
- [ ] T010 Implement AuthGuard at src/systemComponents/auth/guards/auth.guard.ts with session validation and default-deny policy
- [ ] T011 Configure express-session middleware in src/systemComponents/auth/auth.module.ts with MemoryStore, httpOnly cookies, and session settings
- [ ] T012 Create AuthModule at src/systemComponents/auth/auth.module.ts with global AuthGuard registration and OnModuleInit user seeding
- [ ] T013 Update src/app.module.ts to import AuthModule as global module
- [ ] T014 [P] Write unit tests for UserService at src/systemComponents/auth/__tests__/user.service.spec.ts
- [ ] T015 [P] Write unit tests for SessionService at src/systemComponents/auth/__tests__/session.service.spec.ts
- [ ] T016 [P] Write unit tests for AuthGuard at src/systemComponents/auth/__tests__/auth.guard.spec.ts
- [ ] T017 Verify foundational infrastructure: run all unit tests for services and guard

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Login with Magic Link (Priority: P1) 🎯 MVP

**Goal**: Users can request a magic link via email, click the link, and authenticate to the platform

**Independent Test**: Enter email at /login, receive magic link email in Mailpit, click link, verify authenticated session at /auth/session

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T018 [P] [US1] Write contract tests for POST /auth/request-magic-link endpoint at tests/contract/auth/request-magic-link.spec.ts
- [ ] T019 [P] [US1] Write contract tests for GET /auth/verify/:token endpoint at tests/contract/auth/verify-token.spec.ts
- [ ] T020 [P] [US1] Write integration test for complete magic link flow at tests/integration/auth/magic-link-flow.spec.ts
- [ ] T021 [P] [US1] Write integration test for rate limiting behavior at tests/integration/auth/rate-limiting.spec.ts
- [ ] T022 [US1] Verify all User Story 1 tests fail before implementation (expected behavior for TDD)

### Implementation for User Story 1

- [ ] T023 [P] [US1] Implement AuthService at src/systemComponents/auth/services/auth.service.ts with token generation (crypto.randomBytes), hashing (SHA-256), and validation methods
- [ ] T024 [P] [US1] Implement rate limiting logic in AuthService with in-memory Map tracking (5 requests per hour per user)
- [ ] T025 [P] [US1] Implement magic link email template and sending logic in AuthService using existing EmailService, with error handling for email service failures (return generic error message to user)
- [ ] T026 [US1] Implement AuthController at src/systemComponents/auth/controllers/auth.controller.ts with POST /auth/request-magic-link endpoint, including timing-safe responses to prevent user enumeration
- [ ] T027 [US1] Implement GET /auth/verify/:token endpoint in AuthController with token validation, session creation, old session invalidation (one session per user per FR-026), and redirect to / (home page)
- [ ] T028 [US1] Implement GET /auth/session endpoint in AuthController to check current authentication status
- [ ] T029 [P] [US1] Create LoginPage component at src/systemComponents/auth/ui/LoginPage.tsx with form for email/username input and CSRF token
- [ ] T030 [P] [US1] Create MagicLinkSentPage component at src/systemComponents/auth/ui/MagicLinkSentPage.tsx for confirmation message
- [ ] T031 [P] [US1] Create MagicLinkErrorPage component at src/systemComponents/auth/ui/MagicLinkErrorPage.tsx for error display (expired, invalid, used tokens)
- [ ] T032 [P] [US1] Create CSS styles at src/systemComponents/auth/ui/login-page.css for authentication pages
- [ ] T033 [US1] Implement LoginController at src/systemComponents/auth/controllers/login.controller.ts with GET /login route rendering LoginPage
- [ ] T034 [US1] Register auth routes in AuthModule with proper CSRF protection configuration
- [ ] T035 [P] [US1] Write unit tests for AuthService at src/systemComponents/auth/__tests__/auth.service.spec.ts covering token generation, validation, rate limiting, and email sending
- [ ] T036 [P] [US1] Write unit tests for AuthController at src/systemComponents/auth/__tests__/auth.controller.spec.ts
- [ ] T037 [P] [US1] Write component tests for LoginPage at src/systemComponents/auth/__tests__/LoginPage.spec.tsx
- [ ] T038 [US1] Run all User Story 1 tests and verify they pass
- [ ] T039 [US1] Manual testing: Follow quickstart.md test scenario for magic link flow using Mailpit

**Checkpoint**: User Story 1 complete - users can authenticate via magic links. MVP functionality achieved.

---

## Phase 4: User Story 2 - Logout (Priority: P2)

**Goal**: Users can explicitly terminate their authenticated session for security

**Independent Test**: Login via magic link, verify session at /auth/session, click logout button, verify session destroyed

### Tests for User Story 2

- [ ] T040 [P] [US2] Write contract tests for POST /auth/logout endpoint at tests/contract/auth/logout.spec.ts
- [ ] T041 [P] [US2] Write integration test for session termination at tests/integration/auth/session-termination.spec.ts
- [ ] T042 [US2] Verify all User Story 2 tests fail before implementation

### Implementation for User Story 2

- [ ] T043 [US2] Implement POST /auth/logout endpoint in AuthController with session destruction and redirect to /login
- [ ] T044 [P] [US2] Create logout form component at src/systemComponents/auth/ui/LogoutButton.tsx and integrate into home page or create shared layout component
- [ ] T045 [P] [US2] Write unit tests for logout endpoint behavior in src/systemComponents/auth/__tests__/auth.controller.spec.ts
- [ ] T046 [US2] Run all User Story 2 tests and verify they pass
- [ ] T047 [US2] Manual testing: Test logout flow and verify session cannot be reused

**Checkpoint**: User Story 2 complete - users can securely log out

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, security hardening, and final touches

- [ ] T048 [P] Create developer guide at docs/dev_guides/AUTHENTICATION_GUIDE.md with setup, usage examples, and troubleshooting
- [ ] T049 [P] Create implementation documentation at docs/implementation_doc/AUTHENTICATION_IMPLEMENTATION.md with architecture, security decisions, and patterns
- [ ] T050 [P] Implement daily background job for expired token cleanup in AuthService (delete tokens where expiresAt < now())
- [ ] T051 [P] Add structured JSON logging for authentication events (login attempts, failures, rate limits) throughout AuthService and AuthController
- [ ] T052 [P] Configure security headers (CSP, X-Frame-Options, X-Content-Type-Options) in AuthModule or app.module.ts
- [ ] T053 [P] Add session absolute expiration (7 days maximum) to session configuration
- [ ] T054 [P] Add session regeneration after successful authentication (prevent session fixation) in AuthController verify endpoint
- [ ] T055 Review OWASP Top 10 coverage and document in docs/AUTHENTICATION_SECURITY_REVIEW.md
- [ ] T056 Review CWE Top 25 coverage and add to security review document
- [ ] T057 Run complete test suite: `npm test` and verify all tests pass
- [ ] T058 Run linting: `npm run lint` and fix any issues
- [ ] T059 Validate quickstart.md scenarios work end-to-end with fresh database
- [ ] T060 [P] Update main README.md with authentication feature documentation
- [ ] T061 [P] Update .github/copilot-instructions.md with authentication technology and patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion - Can proceed independently
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can proceed after or in parallel with US1 (logout requires session infrastructure but not magic link logic)
- **Polish (Phase 5)**: Depends on all desired user stories (Phase 3 & 4) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Minimal dependency on US1 (just needs session creation to exist for logout to make sense), but independently testable

### Within Each User Story

**User Story 1 (Login with Magic Link)**:
1. Tests first (T018-T022) - Write and verify they fail
2. Core services (T023-T025) - AuthService with all magic link logic
3. Controllers (T026-T028) - API endpoints
4. UI components (T029-T033) - Login pages
5. Integration (T034) - Route registration
6. Unit tests (T035-T037) - Service and controller tests
7. Validation (T038-T039) - Run all tests and manual verification

**User Story 2 (Logout)**:
1. Tests first (T040-T042) - Write and verify they fail
2. Implementation (T043-T044) - Logout endpoint and UI
3. Unit tests (T045) - Test coverage
4. Validation (T046-T047) - Run tests and manual verification

### Parallel Opportunities

**Phase 1 (Setup)**: T002 and T003 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T006, T007, T008, T009 can all run in parallel (different files, no dependencies)
- T014, T015, T016 can all run in parallel (test files, independent)

**Phase 3 (User Story 1)**:
- T018, T019, T020, T021 can all run in parallel (different test files)
- T023, T024, T025 can run in parallel (different aspects of AuthService)
- T029, T030, T031, T032 can all run in parallel (different UI files)
- T035, T036, T037 can run in parallel (different test files)

**Phase 4 (User Story 2)**:
- T040, T041 can run in parallel (different test files)
- T044, T045 can run in parallel (UI and tests, different files)

**Phase 5 (Polish)**:
- T048, T049, T050, T051, T052, T053, T054, T060, T061 can all run in parallel (different files)

**Cross-Phase Parallelism**:
- Once Phase 2 (Foundational) is complete, Phase 3 (US1) and Phase 4 (US2) can proceed in parallel if team capacity allows
- However, US2 benefits from US1 being functional for better testing (can test logout after real login)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch all US1 test files together:
Task T018: "Contract tests for POST /auth/request-magic-link"
Task T019: "Contract tests for GET /auth/verify/:token"
Task T020: "Integration test for magic link flow"
Task T021: "Integration test for rate limiting"

# Then launch all US1 UI components together:
Task T029: "Create LoginPage.tsx"
Task T030: "Create MagicLinkSentPage.tsx"
Task T031: "Create MagicLinkErrorPage.tsx"
Task T032: "Create login-page.css"

# Then launch all US1 unit tests together:
Task T035: "Unit tests for AuthService"
Task T036: "Unit tests for AuthController"
Task T037: "Component tests for LoginPage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This is the recommended approach for initial delivery:

1. **Complete Phase 1**: Setup (T001-T005)
   - Create project structure
   - Set up database schema
   - Configure environment
   
2. **Complete Phase 2**: Foundational (T006-T017) - CRITICAL
   - Build core services (UserService, SessionService)
   - Implement authentication guard
   - Set up session middleware
   - Write foundational unit tests
   
3. **Complete Phase 3**: User Story 1 (T018-T039)
   - Implement magic link authentication
   - Build login UI
   - Complete all tests
   
4. **STOP and VALIDATE**: 
   - Run all tests: `npm test`
   - Manual testing: Follow quickstart.md scenarios
   - Verify magic link flow works end-to-end
   
5. **Deploy/Demo**: 
   - MVP is ready with full authentication
   - Users can log in securely via magic links
   - Session management working

### Incremental Delivery

After MVP, add features incrementally:

1. **MVP Delivery** (Phases 1-3): Magic link authentication working
   - Users can request magic links
   - Users can authenticate via email links
   - Sessions managed securely
   - Deploy and gather feedback

2. **Logout Addition** (Phase 4): Add User Story 2
   - Implement logout endpoint
   - Add logout UI
   - Test independently
   - Deploy update

3. **Polish** (Phase 5): Final improvements
   - Add documentation
   - Security review
   - Performance optimization
   - Background cleanup jobs
   - Deploy final version

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers available:

**Initial Phase (Together)**:
1. Team completes Phase 1 (Setup) together - ~1-2 hours
2. Team completes Phase 2 (Foundational) together - ~1-2 days
   - Critical path that blocks everything else
   - Worth having full team focus here

**Parallel Development** (Once Phase 2 complete):
- **Developer A**: User Story 1 (T018-T039)
  - Focus: Magic link authentication
  - Tests, AuthService, controllers, UI
  - Most complex user story
  
- **Developer B**: User Story 2 (T040-T047)
  - Focus: Logout functionality
  - Simpler, can complete quickly
  - May wait for US1 session creation for better integration testing
  
- **Developer C**: Polish work (T048-T054)
  - Focus: Documentation, security, cleanup jobs
  - Can start some tasks early (docs can be drafted)

**Integration**:
- Stories integrate naturally through shared services (from Phase 2)
- Each story independently testable
- Final integration testing in Phase 5

---

## Testing Strategy

### Test-Driven Development (TDD)

This feature follows strict TDD:

1. **Write Tests First**: For each user story, write all tests BEFORE implementation
2. **Verify Tests Fail**: Ensure tests fail initially (red phase)
3. **Implement**: Write minimum code to make tests pass (green phase)
4. **Refactor**: Clean up code while keeping tests passing

### Test Types

**Unit Tests** (Service & Controller layer):
- UserService: CRUD operations, lookups, validation
- SessionService: Create, validate, destroy sessions
- AuthService: Token generation, validation, rate limiting, email sending
- AuthGuard: Session validation, route protection
- AuthController: Endpoint behavior, error handling
- LoginController: Page rendering

**Integration Tests** (Complete flows):
- Magic link flow: Request → Email → Verify → Session
- Rate limiting: Multiple requests → 429 response
- Session management: Login → Check session → Timeout
- Session termination: Logout → Session destroyed

**Contract Tests** (API compliance):
- POST /auth/request-magic-link: Request/response format
- GET /auth/verify/:token: Success and error responses
- POST /auth/logout: Session destruction
- GET /auth/session: Session status response

**Component Tests** (UI rendering):
- LoginPage: Form rendering, CSRF token, submission
- MagicLinkSentPage: Confirmation message
- MagicLinkErrorPage: Error display

### Test Coverage Goals

- Unit tests: 90%+ coverage on services and controllers
- Integration tests: All critical user journeys
- Contract tests: All API endpoints
- Component tests: All UI components

### Testing Tools

- Jest 30: Test runner and assertions
- @nestjs/testing: NestJS test utilities
- supertest: HTTP integration tests
- @testing-library/react: React component tests
- Mailpit: Email capture and verification (local dev)

---

## Security Checklist

This checklist ensures all security requirements from plan.md are implemented:

### OWASP Top 10 Coverage

- [ ] **A01:2021 Broken Access Control**: AuthGuard enforces authentication on all routes except /auth/**
- [ ] **A02:2021 Cryptographic Failures**: Token generation uses crypto.randomBytes (256 bits), SHA-256 hashing, HTTPS in production
- [ ] **A03:2021 Injection**: Parameterized Prisma queries throughout, input validation on all user inputs
- [ ] **A04:2021 Insecure Design**: Magic links time-limited (15 min), single-use, rate-limited (5/hour)
- [ ] **A05:2021 Security Misconfiguration**: Environment variables for secrets, fail-fast on missing config, security headers
- [ ] **A06:2021 Vulnerable Components**: Using maintained dependencies (NestJS 11, Prisma 6, Nodemailer 7, express-session 1.18)
- [ ] **A07:2021 Identification/Authentication Failures**: Strong token generation (256 bits), session management, rate limiting, timing-safe comparisons
- [ ] **A08:2021 Software/Data Integrity Failures**: N/A for this feature
- [ ] **A09:2021 Security Logging Failures**: All auth attempts logged (success/failure), JSON structured logging
- [ ] **A10:2021 SSRF**: N/A for this feature

### CWE Top 25 Relevant Items

- [ ] **CWE-79 XSS**: HttpOnly cookies, CSP headers, no client-side JavaScript
- [ ] **CWE-89 SQL Injection**: Parameterized Prisma queries only
- [ ] **CWE-20 Input Validation**: Validate email format, username format, all user inputs
- [ ] **CWE-200 Information Exposure**: Timing-safe responses, generic error messages, no user enumeration
- [ ] **CWE-287 Authentication**: Strong token generation, proper session management, rate limiting
- [ ] **CWE-352 CSRF**: CSRF protection via existing infrastructure, Synchronizer Token Pattern
- [ ] **CWE-306 Missing Authentication**: Default-deny policy via global AuthGuard
- [ ] **CWE-798 Hardcoded Credentials**: All secrets from environment variables
- [ ] **CWE-327 Weak Crypto**: crypto.randomBytes (CSPRNG), SHA-256 hashing, 256-bit entropy
- [ ] **CWE-384 Session Fixation**: Session regeneration after authentication

### Security Implementation Tasks (from Phase 5)

- [ ] T052: Security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] T053: Session absolute expiration (7 days)
- [ ] T054: Session regeneration (prevent fixation)
- [ ] T055: OWASP Top 10 review document
- [ ] T056: CWE Top 25 review in security document

---

## Notes

- **[P] marker**: Tasks that can run in parallel (different files, no dependencies)
- **[Story] label**: Maps task to specific user story (US1, US2) for traceability
- **File paths**: All paths are absolute from repository root (src/...)
- **TDD approach**: Write tests first, verify they fail, then implement
- **Independent stories**: Each user story should be completable and testable on its own
- **Commit strategy**: Commit after each task or logical group of related tasks
- **Checkpoints**: Stop at each checkpoint to validate the phase/story works correctly
- **Zero new dependencies**: All using existing project dependencies (TypeScript, NestJS, Prisma, React, Nodemailer, express-session)
- **Reuse existing infrastructure**: CSRF protection, EmailService, Prisma component discovery, SSR rendering all reused unchanged

---

## Summary

**Total Tasks**: 61 tasks across 5 phases

**Tasks per Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 12 tasks (BLOCKING - must complete first)
- Phase 3 (User Story 1 - Magic Link): 22 tasks (MVP)
- Phase 4 (User Story 2 - Logout): 8 tasks
- Phase 5 (Polish): 14 tasks

**MVP Scope** (Phases 1-3): 39 tasks
- Delivers: Complete magic link authentication system
- Users can: Request magic links, authenticate via email, maintain sessions
- Estimated effort: 3-5 days for single developer, 2-3 days for team

**Parallel Opportunities**:
- Phase 1: 2 tasks can run in parallel
- Phase 2: 7 tasks can run in parallel (after sequential dependencies)
- Phase 3: 11 tasks can run in parallel (within sub-phases)
- Phase 4: 4 tasks can run in parallel
- Phase 5: 10 tasks can run in parallel

**Suggested MVP Path**: 
1. Complete Phases 1 & 2 (foundation) - ~2 days
2. Complete Phase 3 (User Story 1) - ~2 days
3. Validate and deploy MVP - ~0.5 days
4. Add Phase 4 (User Story 2) incrementally - ~0.5 days
5. Polish (Phase 5) as time permits - ~1 day

**Total Estimated Effort**: 5-7 days for single developer, 3-4 days for team of 2-3
