# Implementation Plan: Outgoing Email Capability

**Branch**: `004-outgoing-email` | **Date**: 2025-10-28 | **Spec**: `/specs/004-outgoing-email/spec.md`
**Input**: Feature specification from `/specs/004-outgoing-email/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Provide a simple, reliable outgoing email capability for transactional notifications using SMTP. Callers pass a ReactElement body that the service renders to HTML via JSX SSR. No REST endpoint is added; the service is consumed via an internal JS/TS API. Configuration uses a single SMTP pathway: in dev/test, point SMTP_HOST/SMTP_PORT to Mailpit; in production, point to the real provider. Security and simplicity drive the design: TLS usage is configurable, DKIM/SPF are provider-managed, and logs contain metadata only (no PII, no subject/body). TDD-first with integration tests against Mailpit.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+), NestJS 11  
**Primary Dependencies**: Nodemailer (SMTP client), React/ReactDOM SSR (existing), NestJS Logger (existing)  
**Storage**: N/A (no persistence; transient processing only)  
**Testing**: Jest + Supertest; Mailpit for integration tests (via Docker Compose)  
**Target Platform**: Linux server (Docker), Node 20+  
**Project Type**: Single backend project with SSR (existing structure)  
**Performance Goals**: Render email HTML in <200ms; deliver transactional emails within 30s 99% of the time  
**Constraints**: TLS enforcement configurable; HTML-only emails; never log PII/subject/body; fail fast on provider errors  
**Scale/Scope**: Up to 10k emails/hour; moderate daily volume (<50k/day)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Service-Oriented Architecture: Email capability will be encapsulated as a system component/service with a documented API; no hidden cross-cutting state. PASS
- II. UI Server-Side Rendering (SSR) with JSX: Email templates use JSX SSR to HTML, consistent with platform. PASS
- III. Component-Hosting Platform: No changes to hosting guarantees; service is additive and scoped. PASS
- IV. TDD: Tests (unit + integration via Mailpit) precede implementation; coverage for validation, rendering, and sending paths. PASS
- V. Security by Design: Input validation, TLS support with enforcement option, provider-managed DKIM/SPF, strict log redaction. PASS
- VI. Simplicity and Minimalism: Single dependency (Nodemailer) for SMTP, no queues/extra infra in v1, environment-config driven routing. PASS

Why not simpler? Using raw SMTP sockets would reduce one dependency but would re-implement robust SMTP handling (TLS negotiation, auth methods, error codes). Nodemailer is the simplest well-maintained abstraction for our needs and remains easy to replace.

Re-check after Phase 1 design: No new violations introduced. Gate status: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── email/                     # Email service module (API, validation, sender adapter)
├── ssr/                       # Existing SSR utilities reused for email rendering
└── utils/                     # Base64 image embedder

tests/
├── integration/
│   └── email*.spec.ts         # Mailpit-backed end-to-end tests
└── unit/
    └── email/*.spec.ts        # Validation and rendering tests
```

**Structure Decision**: Single repo/project structure. Introduce a scoped `src/email` module exposing a simple service API; tests live under existing `tests/` folders. Reuse existing SSR infra under `src/ssr` for JSX rendering. No new global config layers.

Contracts: No OpenAPI/GraphQL. Internal TypeScript contract documented at `specs/004-outgoing-email/contracts/email-service.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
