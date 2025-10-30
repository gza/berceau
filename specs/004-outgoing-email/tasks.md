---
description: "Task list for Outgoing Email Capability implementation"
---

# Tasks: Outgoing Email Capability

**Input**: Design documents from `/specs/004-outgoing-email/`
**Prerequisites**: plan.md (tech stack, structure), spec.md (user stories), research.md (decisions), data-model.md (entities), contracts/ (API)

**Tests**: Tests are included per TDD requirement in feature specification and constitution check (IV. TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project structure: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and email module structure

- [X] T001 Install Nodemailer dependency: `npm install nodemailer @types/nodemailer`
- [X] T002 Create email module directory structure: `src/email/`
- [X] T003 [P] Create TypeScript interfaces file in `src/email/types.ts` (EmailAddress, SendEmailInput, SendEmailResult, SendEmailSuccess, SendEmailFailure, SendEmailErrorType)
- [X] T004 [P] Create email configuration schema in `src/email/config.ts` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TLS_ENFORCED, SMTP_FROM_DEFAULT, TIMEOUT_CONNECT_MS, TIMEOUT_SEND_MS)
- [X] T005 Add Mailpit service to `docker-compose.yml` (image: axllent/mailpit, ports 1025 SMTP and 8025 web UI)
- [X] T006 [P] Update `.env.example` with email configuration variables (SMTP_HOST=mailpit, SMTP_PORT=1025, SMTP_TLS_ENFORCED=false, SMTP_FROM_DEFAULT)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core email infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create validation utilities in `src/email/validation.ts` (email address RFC 5322, subject length max 200 chars, HTML size max 500KB, non-empty checks)
- [X] T008 Create email error builder in `src/email/errors.ts` (EmailError factory with type, message, code, context)
- [X] T009 Create logger utilities with PII redaction in `src/email/logger.ts` (mask email addresses as `u***@d***`, never log subject/body)
- [X] T010 Create SMTP transport factory in `src/email/transport.ts` (Nodemailer transport with TLS enforcement, auth, timeouts from config)
- [X] T011 Create base64 image embedding helper in `src/utils/base64-embedder.ts` (convert local image files to base64 data URIs for email inline use)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Send Transactional Email (Priority: P1) 🎯 MVP

**Goal**: Enable the system to send transactional emails (form confirmations, notifications, alerts) reliably with validation, error handling, and delivery confirmation.

**Independent Test**: Trigger a system event (like form submission), call the send API, verify the email is delivered with correct content via Mailpit or SMTP provider.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T012 [P] [US1] Create unit test for email validation in `src/email/email-validation.spec.ts` (test valid/invalid email addresses, subject constraints, HTML size limits)
- [X] T013 [P] [US1] Create unit test for error handling in `src/email/email-errors.spec.ts` (test error types: validation, send, auth, timeout, unavailable)
- [X] T014 [P] [US1] Create integration test for basic email sending in `tests/integration/email-send.spec.ts` (test send success to Mailpit, verify message received)
- [X] T015 [P] [US1] Create integration test for send failures in `tests/integration/email-failures.spec.ts` (test validation failures, auth failures, timeout scenarios)

### Implementation for User Story 1

- [X] T016 [US1] Implement JSX to HTML renderer in `src/email/renderer.ts` (use existing SSR utilities from `src/ssr/` to render ReactElement to HTML string)
- [X] T017 [US1] Implement EmailService send method in `src/email/email.service.ts` (validate input, render JSX, send via SMTP transport, return SendEmailResult)
- [X] T018 [US1] Implement SMTP sender adapter in `src/email/smtp-sender.ts` (call Nodemailer transport, handle success/error responses, map to EmailError types)
- [X] T019 [US1] Create NestJS module for email in `src/email/email.module.ts` (export EmailService, configure providers)
- [X] T020 [US1] Integrate email module into main app module in `src/app.module.ts` (import EmailModule)
- [X] T021 [US1] Add comprehensive error handling for all error types (validation, render, send, auth, rate_limit, timeout, unavailable) in `src/email/email.service.ts`
- [X] T022 [US1] Add logging for email operations in `src/email/email.service.ts` (log metadata: template id/type, provider status, message id; redact addresses; never log subject/body)

**Checkpoint**: At this point, User Story 1 should be fully functional - can send transactional emails with validation, error handling, and logging

---

## Phase 4: User Story 2 - Email Template Management (Priority: P2)

**Goal**: Enable developers to create email content using JSX with props, render it server-side to HTML, and support formatting (bold, links, images) that works across email clients. Provide infrastructure and examples, but no pre-built template components.

**Independent Test**: Create JSX email content inline or as a helper function with props (name, date, link, image), call send API with the JSX, verify the email in Mailpit contains correctly rendered HTML with all props and formatting.

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] Create unit test for JSX rendering in `src/email/email-renderer.spec.ts` (test ReactElement to HTML conversion, props rendering, formatting preservation)
- [X] T024 [P] [US2] Create unit test for base64 image embedding in `tests/unit/utils/base64-embedder.spec.ts` (test local image file to data URI conversion, size limits, unsupported formats)
- [X] T025 [P] [US2] Create integration test for email content patterns in `tests/integration/email-templates.spec.ts` (test various JSX patterns with props, verify rendered HTML in Mailpit - serves as reference examples)

### Implementation for User Story 2

- [X] T026 [US2] Enhance renderer to support email-specific HTML in `src/email/renderer.ts` (add email client compatibility helpers: renderEmailDocument for full HTML structure, embedImageForEmail wrapper)
- [X] T027 [US2] Integrate base64 image embedder into renderer in `src/email/renderer.ts` (provide embedImageForEmail helper function for developers to use in their email content)
- [X] T028 [US2] Create developer guide in `docs/dev_guides/OUTGOING_EMAIL_GUIDE.md` (document how to create email content with JSX, email client compatibility via canimail validation, supported HTML/CSS features, best practices, reference integration tests as examples)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - can send emails with custom JSX content created by developers

---

## Phase 5: User Story 3 - Email Testing Support (Priority: P3)

**Goal**: Enable developers to test email functionality in development/test environments using Mailpit without sending real emails, with ability to verify email content programmatically.

**Independent Test**: Configure Mailpit via Docker Compose, send test email, access Mailpit web interface (http://localhost:8025), verify email appears with correct content; use Mailpit API in automated test to verify delivery.

### Tests for User Story 3 ⚠️

- [X] T031 [P] [US3] Create integration test for Mailpit capture in `tests/integration/email-mailpit.spec.ts` (send email, query Mailpit API, verify email captured)
- [X] T032 [P] [US3] Create integration test for Mailpit API queries in `tests/integration/email-mailpit-api.spec.ts` (test retrieving messages, searching by recipient, verifying content)

### Implementation for User Story 3

- [X] T033 [US3] Create Mailpit API client helper in `src/email/testing/mailpit-client.ts` (HTTP client to query Mailpit API: list messages, get message by ID, search by recipient)
- [X] T034 [US3] Add test utilities for Mailpit verification in `tests/helpers/email-test-utils.ts` (helper functions: waitForEmail, verifyEmailContent, clearMailbox)
- [X] T035 [US3] Document testing workflow in `docs/dev_guides/EMAIL_TESTING_GUIDE.md` (how to use Mailpit, access web UI, query API in tests, verify email content)
- [X] T036 [US3] Add Mailpit startup verification to `jest.globalSetup.ts` (ensure Mailpit is running before tests, provide clear error if not)

**Checkpoint**: All user stories should now be independently functional - complete email capability with templates and testing support

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T037 [P] Create comprehensive developer guide in `docs/dev_guides/OUTGOING_EMAIL_GUIDE.md` (setup instructions, API usage examples, template creation, testing workflow, troubleshooting)
- [X] T038 [P] Create implementation documentation in `docs/implementation_doc/OUTGOING_EMAIL_IMPLEMENTATION.md` (architecture diagrams, design decisions, security measures, error handling strategy, logging policy)
- [X] T039 [P] Update project README in `README.md` (add outgoing email capability to features list, link to developer guide)
- [X] T040 Add configuration validation on startup in `src/email/email.module.ts` (validate required env vars present, SMTP connection testable, fail fast with clear errors)
- [X] T041 Add performance monitoring for email operations in `src/email/email.service.ts` (track render time <200ms, send time <30s, log performance metrics)
- [X] T042 Security review: TOP10 OWASP in `docs/EMAIL_SECURITY_REVIEW.md` (review injection risks, TLS enforcement, PII logging, secrets management, rate limiting, input validation)
- [X] T043 Run full test suite and validate all success criteria: `npm test && npm run lint`
- [X] T044 Validate quickstart.md instructions in `specs/004-outgoing-email/quickstart.md` (follow steps, verify dev environment works, test example code)
- [X] T045 Performance validation against success criteria (SC-003: errors <2s, SC-004: 10k emails/hour, SC-005: render <200ms, SC-007: test verification <1s)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but is independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Supports testing US1/US2 but is independently implementable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Renderer before service
- Service before integration
- Templates before template tests
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 Setup**: T003, T004, T006 can run in parallel (different files)
- **Phase 2 Foundational**: All tasks (T007-T011) can run in parallel (different files)
- **User Story 1 Tests**: T012, T013, T014, T015 can run in parallel (different test files)
- **User Story 2 Tests**: T023, T024, T025 can run in parallel (different test files)
- **User Story 2 Templates**: T026, T027 can run in parallel (different template files)
- **User Story 3 Tests**: T031, T032 can run in parallel (different test files)
- **Polish Phase**: T037, T038, T039 can run in parallel (different documentation files)
- **Once Foundational completes**: All three user stories (US1, US2, US3) can start in parallel if team capacity allows

---

### Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write first, ensure they fail):
Task: "Create unit test for email validation in src/email/email-validation.spec.ts"
Task: "Create unit test for error handling in src/email/email-errors.spec.ts"
Task: "Create integration test for basic email sending in tests/integration/email-send.spec.ts"
Task: "Create integration test for send failures in tests/integration/email-failures.spec.ts"

# After tests fail, no parallel implementation tasks within US1 due to dependencies
# (renderer → service → sender → module → integration → error handling → logging)
```

### Note on Templates

User Story 2 provides the **infrastructure** for creating email content with JSX (renderer, helpers, documentation) and **examples** in integration tests, but does **not** include pre-built template components. Developers create email content inline in their services or extract reusable helper functions as needed for their use cases.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T011) - CRITICAL GATE
3. Complete Phase 3: User Story 1 (T012-T022)
   - Write all tests first (T012-T015), ensure they FAIL
   - Implement functionality (T016-T022)
4. **STOP and VALIDATE**: Run tests, send email to Mailpit, verify success
5. Deploy/demo if ready - basic transactional email capability works!

### Incremental Delivery

1. **Foundation** (Phases 1-2): Setup + Foundational → Core infrastructure ready
2. **MVP** (Phase 3): Add User Story 1 → Test independently → **Deploy/Demo** (basic email sending works!)
3. **JSX Content** (Phase 4): Add User Story 2 → Test independently → **Deploy/Demo** (developers can create JSX email content!)
4. **Testing** (Phase 5): Add User Story 3 → Test independently → **Deploy/Demo** (Mailpit integration complete!)
5. **Production Ready** (Phase 6): Polish → Security review → **Deploy/Demo** (full feature complete!)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (Phases 1-2)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (Phase 3) - Core sending
   - Developer B: User Story 2 (Phase 4) - JSX content infrastructure
   - Developer C: User Story 3 (Phase 5) - Testing support
3. Stories complete and integrate independently
4. **Together**: Polish phase (Phase 6)

---

## Task Summary

- **Total Tasks**: 45
- **Setup Phase**: 6 tasks
- **Foundational Phase**: 5 tasks (blocking)
- **User Story 1 (P1)**: 11 tasks (4 test + 7 implementation)
- **User Story 2 (P2)**: 6 tasks (3 test + 3 implementation) - Infrastructure for JSX content creation
- **User Story 3 (P3)**: 6 tasks (2 test + 4 implementation)
- **Polish Phase**: 9 tasks
- **Parallelizable Tasks**: 19 tasks marked [P]
- **MVP Scope**: Phases 1-3 (22 tasks) delivers basic transactional email capability

---

## Success Criteria Validation

After completing all tasks, verify against spec.md success criteria:

- **SC-001**: Emails delivered within 30s (99% of time) - verify with performance monitoring (T041)
- **SC-002**: 99.5% delivery success - verify through integration tests and monitoring
- **SC-003**: Failures return errors within 2s - verify with integration tests (T015)
- **SC-004**: Handle 10k emails/hour - verify with performance validation (T045)
- **SC-005**: JSX render <200ms - verify with performance monitoring (T041, T045)
- **SC-006**: Mailpit setup with one command - verify via quickstart validation (T044)
- **SC-007**: Test verification <1s - verify with integration tests (T031, T032)
- **SC-008**: Issue resolution within 5min via logs - verify logging implementation (T022)
- **SC-009**: Invalid params detected 99% - verify validation tests (T012)
- **SC-010**: SMTP/TLS connection 99.9% - verify transport implementation (T010)

---

## Notes

- **[P]** tasks = different files, no dependencies
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD REQUIRED**: Write tests first, ensure they FAIL before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Security**: Never log subject/body; redact email addresses; enforce TLS in production
- **Performance**: Monitor render time and send time against success criteria
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
