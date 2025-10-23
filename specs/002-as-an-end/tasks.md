---
description: "Task list for Component-Level Database Integration feature"
---

# Tasks: Component-Level Database Integration

**Input**: Design documents from `/specs/002-as-an-end/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/demo-ui.md

**Tests**: Tests are NOT explicitly requested in the specification. This feature uses standard testing approaches but does not require TDD workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions
- Single project structure at repository root
- Source code: `src/`
- Tests: `tests/` and `src/components/demo/test/`
- Prisma schemas: `prisma/schema/` (centralized) and `src/components/*/prisma/` (component-level)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize database infrastructure and Prisma configuration

- [x] T001 Verify PostgreSQL database is running via Docker Compose (see AGENTS.md)
- [x] T002 Create `.env` file at project root with `DATABASE_URL` and `MIGRATION_DATABASE_URL` environment variables (see quickstart.md for format)
- [x] T003 Create central Prisma directory structure: `prisma/schema/` and `prisma/migrations/`
- [x] T004 Install Prisma CLI and Prisma Client dependencies: `@prisma/client` and `prisma` (dev dependency) - verify version >= 6.7.0

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005-T010 Create Webpack plugin in `build/database-schema-plugin.js` that discovers component Prisma schemas, copies them to `prisma/schema/`, generates `main.prisma`, and runs `prisma generate`
- [x] T011 Create PrismaService in `src/database/runtime/prisma.service.ts` extending PrismaClient with NestJS lifecycle hooks (OnModuleInit, OnModuleDestroy)
- [x] T012 Register PrismaService as global provider in root AppModule (`src/app.module.ts`)
- [x] T013 Create test utilities for database testing in `src/database/test-utils/setup.ts` (database connection helpers, transaction utilities)

**Note**: Tasks T005-T010 were consolidated into a single Webpack plugin implementation rather than separate NestJS services, as the schema discovery and generation logic is only needed at build-time.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Component Database Schema Definition and Build Integration (Priority: P1) 🎯 MVP

**Goal**: Enable component developers to define Prisma schemas in their components and have them automatically discovered, collected, and compiled into a centralized Prisma Client during the build process.

**Independent Test**: Create a test component with a Prisma schema, run the build process, and verify:
1. Schema is discovered and copied to `prisma/schema/`
2. `prisma/schema/main.prisma` is generated with correct datasource/generator blocks
3. Centralized Prisma Client is generated with models from the component
4. TypeScript IntelliSense works for the generated models

### Implementation for User Story 1

- [X] T017 Create demo component directory structure: `src/components/demo/` with subdirectories `prisma/`, `test/`, `ui/`
- [X] T018 Create demo component Prisma schema file at `src/components/demo/prisma/schema.prisma` with DemoUser and DemoPost models (see data-model.md for schema structure)
- [X] T019 Add DemoPostStatus enum to demo component schema (DRAFT, PUBLISHED, ARCHIVED)
- [X] T020 Create demo component metadata file at `src/components/demo/component.meta.ts` following existing component metadata pattern
- [X] T021 Run build process to verify schema discovery and copying: `npm run build`
- [X] T022 Verify `prisma/schema/main.prisma` is generated with correct datasource (PostgreSQL, env("MIGRATION_DATABASE_URL")) and generator blocks
- [X] T023 Verify `prisma/schema/demo.prisma` exists and contains the DemoUser and DemoPost models
- [X] T024 Run Prisma generate command: `npx prisma generate` (should be automatic in build, but verify manually)
- [X] T025 Verify Prisma Client is generated in `node_modules/.prisma/client` with DemoUser and DemoPost models
- [X] T026 Test TypeScript imports of Prisma Client in a temporary test file to verify IntelliSense and type safety
- [X] T027 Create initial database migration: `npx prisma migrate dev --name init_demo_component`
- [X] T028 [P] Add integration test in `src/components/demo/test/discovery.spec.ts` to verify schema file is discovered by build process
- [X] T029 [P] Add integration test in `tests/integration/db/schema-compilation.spec.ts` to verify complete build process generates correct centralized schema
- [X] T030 Update `.github/copilot-instructions.md` with technology stack updates (Prisma ORM v6.7.0+, PostgreSQL)

**Checkpoint**: At this point, component schemas are discoverable, build process works, and centralized Prisma Client is generated with full type safety

---

## Phase 4: User Story 2 - Database Access in Component Code and Tests (Priority: P2)

**Goal**: Enable component developers to import and use the centralized Prisma Client in their component code and tests with clear documentation and examples.

**Independent Test**: Write component code that imports the Prisma Client, performs database operations (create, read, update, delete), and verify:
1. Database operations execute successfully
2. TypeScript types are correct
3. Test isolation works properly
4. Demo component UI displays data correctly

### Implementation for User Story 2

- [X] T031 Create demo component service at `src/components/demo/component.service.ts` that injects PrismaService and implements business logic methods
- [X] T032 Implement `createUser` method in demo service to create DemoUser records
- [X] T033 Implement `createPost` method in demo service to create DemoPost records with author relationship
- [X] T034 Implement `getAllPosts` method in demo service to fetch all posts with author data (include relation)
- [X] T035 Implement `deletePost` method in demo service to delete a post by ID
- [X] T036 Create demo component controller at `src/components/demo/component.controller.tsx` with NestJS decorators and JSX rendering
- [X] T037 Implement GET `/demo/posts` route in demo controller to display post list page (server-side render JSX)
- [X] T038 Implement POST `/demo/posts` route in demo controller to handle new post creation (upsert user, create post, redirect)
- [X] T039 Implement POST `/demo/posts/:id/delete` route in demo controller to handle post deletion
- [X] T040 Create JSX components for demo UI in `src/components/demo/ui/PostList.tsx` (displays all posts)
- [X] T041 Create JSX components for demo UI in `src/components/demo/ui/PostForm.tsx` (add new post form)
- [X] T042 Create JSX components for demo UI in `src/components/demo/ui/PostCard.tsx` (single post display with delete button)
- [X] T043 Create demo UI styles in `src/components/demo/ui/demo.css` (basic styling for form and post cards)
- [X] T044 Create demo component module at `src/components/demo/component.module.ts` that registers controller and service
- [X] T045 Register demo component module in root AppModule (`src/app.module.ts`)
- [X] T046 [P] Add integration test in `src/components/demo/test/integration/database-operations.spec.ts` to verify CRUD operations work correctly
- [X] T047 [P] Add integration test in `src/components/demo/test/integration/controller.spec.ts` to verify routes and JSX rendering
- [X] T048 Create quickstart verification script in `tests/integration/database/quickstart-validation.spec.ts` to verify all quickstart.md examples work
- [X] T049 Test demo component manually: start dev server, navigate to `/demo/posts`, create posts, delete posts, verify UI works

**Checkpoint**: At this point, demo component fully demonstrates database integration with working UI and comprehensive test coverage

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, examples, and validation

- [ ] T050 [P] Create comprehensive developer guide at `docs/dev_guides/DATABASE_INTEGRATION_GUIDE.md` with schema definition, migration workflow, and usage patterns
- [ ] T051 [P] Create implementation documentation at `docs/implementation_doc/DATABASE_INTEGRATION_IMPLEMENTATION.md` describing architecture and design decisions
- [ ] T052 [P] Update README.md with database setup instructions and link to developer guide
- [ ] T053 [P] Add database workflow section to AGENTS.md (migration commands, environment variables)
- [ ] T054 Verify all quickstart.md examples are accurate and working
- [ ] T055 Run full test suite: `npm test`
- [ ] T056 Run linting: `npm run lint`
- [ ] T057 Verify Docker Compose database setup works on clean system
- [ ] T058 Test complete workflow from scratch: clone repo, start database, create .env, build, migrate, start dev server
- [ ] T059 Create PR with comprehensive description of the feature, testing instructions, and breaking changes (if any)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) depends on Foundational (Phase 2)
  - User Story 2 (P2) depends on User Story 1 completion (needs Prisma Client to be generated)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - This is the MVP
- **User Story 2 (P2)**: DEPENDS on User Story 1 completion (needs generated Prisma Client and schema) - Cannot run in parallel

### Within Each User Story

#### User Story 1:
1. Create demo component structure (T017-T020)
2. Run build and verify schema discovery (T021-T025)
3. Create migration and test (T026-T029)
4. Update documentation (T030)

#### User Story 2:
1. Create service with business logic (T031-T035)
2. Create controller with routes (T036-T039)
3. Create UI components (T040-T043)
4. Register module (T044-T045)
5. Add tests (T046-T048)
6. Manual verification (T049)

### Parallel Opportunities

Within Phase 2 (Foundational):
- T014, T015, T016 (unit tests) can run in parallel after their respective implementation tasks

Within User Story 1:
- T028, T029 (integration tests) can run in parallel after schema is generated

Within User Story 2:
- T040, T041, T042 (JSX UI components) can run in parallel
- T046, T047, T048 (integration tests) can run in parallel after implementation is complete

Within Phase 5 (Polish):
- T050, T051, T052, T053 (documentation tasks) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After T013 completes, launch all unit tests together:
Task: "Add unit tests for schema discovery service in src/database/discovery/__tests__/schema-discovery.service.spec.ts"
Task: "Add unit tests for schema copying service in src/database/generation/__tests__/schema-copy.service.spec.ts"
Task: "Add unit tests for main schema generator in src/database/generation/__tests__/main-schema-generator.service.spec.ts"
```

## Parallel Example: User Story 2 UI Components

```bash
# Launch all JSX component creation together:
Task: "Create JSX components for demo UI in src/components/demo/ui/PostList.tsx"
Task: "Create JSX components for demo UI in src/components/demo/ui/PostForm.tsx"
Task: "Create JSX components for demo UI in src/components/demo/ui/PostCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004) - Database and environment ready
2. Complete Phase 2: Foundational (T005-T016) - Build infrastructure ready
3. Complete Phase 3: User Story 1 (T017-T030) - Schema discovery and Prisma Client generation working
4. **STOP and VALIDATE**: Test schema discovery independently, verify Prisma Client generation, check TypeScript IntelliSense
5. Demo to stakeholders: Show that component schemas are automatically discovered and compiled

### Full Feature (Both User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Complete User Story 1 → Test independently → Demo schema discovery (MVP!)
3. Complete User Story 2 → Test independently → Demo full CRUD UI with database integration
4. Complete Polish phase → Documentation and validation
5. Final review and PR

### Single Developer Strategy

Work sequentially in priority order:
1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5

At each checkpoint, stop and validate before proceeding.

### Team Strategy

With 2-3 developers:

1. **All together**: Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (schema discovery and build integration)
   - Developer B: Starts on documentation (can run in parallel with US1)
3. **After US1 completes**:
   - Developer A + Developer B: User Story 2 (requires US1's Prisma Client)
4. **Final phase**: All together on Polish tasks (can parallelize documentation)

---

## Notes

- This feature leverages Prisma v6.7.0+ multi-file schema support (GA)
- Manual migration workflow: Developers must run `prisma migrate dev` before starting dev server
- User Story 2 CANNOT run in parallel with User Story 1 due to dependency on generated Prisma Client
- [P] tasks within the same phase can run in parallel (different files, no dependencies)
- [Story] labels map tasks to specific user stories for traceability
- Database credentials via environment variables (`.env` is gitignored)
- PrismaService is globally registered and can be injected anywhere
- Demo component serves as reference implementation for third-party developers
- Each checkpoint is an opportunity to validate, demo, or deploy incrementally
