````markdown
# Implementation Plan: CSRF Token Protection for UI Forms

**Branch**: `003-provide-an-easy` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-provide-an-easy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Refer to `.github/prompts/speckit.plan.prompt.md` for the execution workflow.

## Summary

Provide an easy way to protect POST/PUT/DELETE requests from server-rendered JSX forms using CSRF tokens. The solution uses the Synchronizer Token Pattern with server-side token storage in sessions, automatic validation via NestJS guards, and a simple `<CsrfToken />` JSX component for developers to include in forms. This addresses OWASP Top 10 CSRF vulnerabilities with minimal developer effort.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js with NestJS 11.1.6  
**Primary Dependencies**: NestJS (@nestjs/common, @nestjs/core, @nestjs/platform-express 11.1.6), Express 5.1.0, React 19.1.1 (server-side JSX rendering only), express-session 1.18.1+  
**Storage**: Session storage for CSRF tokens via express-session middleware, PostgreSQL with Prisma ORM v6.7.0+ (for application data, not CSRF tokens)  
**Testing**: Jest 30.1.3 with @testing-library/react 16.3.0 for component testing, supertest 7.1.4 for integration tests  
**Target Platform**: Linux server (Node.js backend)  
**Project Type**: Web application - single project with server-side rendering  
**Performance Goals**: < 5ms added latency per request for CSRF validation (as per spec SC-007)  
**Constraints**: Must not affect component isolation (no global config per Constitution), must integrate with existing SSR pipeline, tokens must be session-scoped  
**Scale/Scope**: Framework-level security feature affecting all form-based routes; designed to scale to 10k+ concurrent users with session management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Service-Oriented Architecture
**Status**: PASS  
**Analysis**: CSRF protection will be implemented as a core security service (NOT a component per user's note) at `src/csrf/`. It provides:
- CSRF token generation and validation services
- Guard for automatic request validation  
- JSX component for token injection
- Well-defined TypeScript API for components to consume

This service is consumed by any component needing form protection without coupling.

### ⚠️ II. UI Server-Side Rendering (SSR) with JSX
**Status**: PASS with attention  
**Analysis**: The `<CsrfToken />` component will render server-side to HTML hidden input fields. Implementation must:
- Use pure server-side rendering (no client hydration)
- Integrate with existing `renderPage` pipeline
- Ensure tokens are generated per-request in the SSR context
- Follow existing SSR patterns (see `src/ssr/renderPage.tsx`)

### ⚠️ III. Component-Hosting Platform  
**Status**: PASS - requires careful design  
**Analysis**: Third-party components must be able to use CSRF protection easily without configuration:
- **No global configuration** that affects component behavior
- Each component opts-in by importing `<CsrfToken />` 
- Validation is automatic via NestJS guard (transparent to components)
- Session management is platform-level infrastructure
- **CRITICAL**: Must NOT introduce shared mutable state that could leak between components

### ✅ IV. Test-Driven Development (TDD)
**Status**: PASS  
**Analysis**: Spec includes comprehensive user stories with acceptance scenarios:
- US1: Programmatic token access (for testing)
- US2: Server-side validation
- US3: Form protection with JSX component
- US4: Flexible opt-out for APIs

Tests must be written first for each scenario before implementation.

### ✅ V. Security by Design
**Status**: PASS  
**Analysis**: This feature directly addresses OWASP Top 10 (CSRF attacks):
- Uses Synchronizer Token Pattern (recommended by OWASP)
- Server-side token storage (secure)
- Automatic validation prevents developer oversight
- Clear opt-out documentation with security warnings
- Follows security best practices from NestJS documentation

**Overall Gate Status**: ✅ **PASS** - Proceed to Phase 0 with attention to component isolation and SSR integration patterns.

## Project Structure

### Documentation (this feature)

```
specs/003-provide-an-easy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── csrf-api.ts      # TypeScript interface definitions
│   └── csrf-component.md # JSX component contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── csrf/                                # NEW: Core CSRF protection service (NOT a component)
│   ├── csrf.module.ts                   # NestJS module for CSRF services
│   ├── csrf.service.ts                  # Token generation and validation logic
│   ├── csrf.guard.ts                    # Automatic validation guard for routes
│   ├── csrf.decorator.ts                # @SkipCsrf() decorator for opt-out
│   ├── csrf-token.component.tsx         # <CsrfToken /> JSX component
│   ├── types.ts                         # TypeScript interfaces and types
│   └── __tests__/                       # Unit tests for CSRF services
│       ├── csrf.service.spec.ts
│       ├── csrf.guard.spec.ts
│       └── csrf-token.component.spec.tsx
│
├── ssr/
│   ├── renderPage.tsx                   # EXISTING: SSR pipeline (may need context injection)
│   └── renderPage.spec.tsx              # EXISTING: Tests
│
├── app.module.ts                        # MODIFIED: Import CsrfModule globally
│
├── main.ts                              # MODIFIED: Configure session middleware
│
└── components/                          # EXISTING: Third-party components
    └── demo/                            # EXISTING: Demo component
        └── ui/
            └── PostListPage.tsx         # MODIFIED: Add <CsrfToken /> to forms (example)

tests/
└── integration/
    └── csrf/                            # NEW: Integration tests for CSRF protection
        ├── form-submission.spec.ts      # Test form POST with/without tokens
        ├── validation.spec.ts           # Test guard validation logic
        └── opt-out.spec.ts              # Test @SkipCsrf() functionality
```

**Structure Decision**: Single project structure (Option 1) with CSRF protection as a core service at `src/csrf/`. This is NOT a systemComponent or component—it's implemented at the root of src as infrastructure that components consume. The implementation follows NestJS module patterns with guards, services, and decorators. The `<CsrfToken />` JSX component integrates with the existing SSR pipeline.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | N/A |

**Note**: While session management introduces some global state (session storage), this is acceptable because:
1. Sessions are standard web infrastructure (like HTTP itself)
2. CSRF tokens are request-scoped within sessions
3. Components don't configure or manage sessions—they only consume the CSRF service
4. The session middleware is configured once in `main.ts` (platform-level, not component-level)

---

## Phase 1 Completion - Final Constitution Check

**Date**: 2025-10-24  
**Status**: ✅ **PASSED** - No violations introduced

### Re-Evaluation After Design Phase

**I. Service-Oriented Architecture** ✅  
- CSRF protection implemented as core service at `src/csrf/`
- Clear API defined in `contracts/csrf-api.ts`
- Components consume via simple `<CsrfToken />` import
- No coupling between components and CSRF implementation

**II. UI Server-Side Rendering (SSR) with JSX** ✅  
- `<CsrfToken />` renders to pure HTML (hidden input)
- Zero client-side JavaScript required
- Integrates with existing `renderPage()` pipeline
- Research document details three SSR context injection patterns (AsyncLocalStorage, Request-Scoped Provider, Context Props)

**III. Component-Hosting Platform** ✅  
- **No global configuration affecting component behavior**
- Each component opts-in by importing `<CsrfToken />`
- Session management is platform infrastructure (like HTTP, not component config)
- CSRF service is stateless at request level (token storage in session, not service)
- Components remain isolated and portable

**IV. Test-Driven Development (TDD)** ✅  
- Comprehensive test strategy defined in `research.md`
- Unit tests for service, guard, and component
- Integration tests for validation flows
- Test utilities defined in `contracts/csrf-api.ts`
- User stories from spec all testable

**V. Security by Design** ✅  
- OWASP Synchronizer Token Pattern implementation
- Cryptographically secure token generation
- Constant-time comparison prevents timing attacks
- Automatic validation via guard (no developer oversight risk)
- Clear opt-out mechanism with security warnings

### Design Decisions Validated

1. **Session Middleware Configuration**: Configured once in `main.ts`, not per-component ✅
2. **Token Storage**: Server-side in session, never client-side ✅
3. **Component API**: Single import, single tag - minimal developer burden ✅
4. **Opt-Out Pattern**: Explicit decorator with JSDoc warnings ✅
5. **SSR Integration**: Pure server rendering, no client hydration required ✅

### No New Violations

The design maintains all constitution principles without introducing:
- Global component configuration
- Shared mutable state between components
- Client-side complexity
- Security compromises

**Final Verdict**: ✅ **Ready for Phase 2 (Task Breakdown)**

````
