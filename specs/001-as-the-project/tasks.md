---
description: "Task list for Component-scoped feature creation (drop-in components)"
---

# Tasks: Component-scoped feature creation (drop-in components)

Input: Design documents from `/specs/001-as-the-project/`
Prerequisites: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

Tests: Tests ARE requested per plan/spec (TDD mandate for discovery/validation and example feature). Include contract/integration tests as tasks for each story.

Organization: Tasks are grouped by user story to enable independent implementation and testing of each story.

Format: `[ID] [P?] [Story] Description`
- [P]: Can run in parallel (different files, no dependencies)
- [Story]: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

Path Conventions
- Single project: `src/`, `tests/` at repository root
- Paths below assume this repository structure from plan.md

Note: All paths are absolute from repo root for clarity when needed.

## Phase 1: Setup (Shared Infrastructure)

Purpose: Ensure repo scaffolding and baseline configs needed by codegen/discovery exist.

- [X] T001 [P] Initialize generated output directory and ignore rules
  - Create folder `src/components.generated/` (git-ignored if not already)
  - Add a README placeholder explaining generated files purpose
  - Ensure `.gitignore` ignores `src/components.generated/` if desired

- [X] T002 [P] Type definitions for feature metadata shape
  - Add `src/components/types.ts` with exported types:
    - `RouteDefinition`, `FeatureMeta`, `NavigationEntry`, `ValidationIssue` (as per data-model.md)
  - Consumers: features' `feature.meta.ts`, codegen validation, registry types

- [X] T003 [P] TS config coverage for generated files
  - Verify `tsconfig.json` includes `src/components.generated/**/*.ts`
  - If excluded, update include/globs to avoid TS import errors in editors/tests

---

## Phase 2: Foundational (Blocking Prerequisites)

Purpose: Core infrastructure that MUST be complete before ANY user story can be implemented.

⚠️ CRITICAL: No user story work can begin until this phase is complete

- [X] T004 Implement Webpack codegen plugin to discover features
  - File: `build/feature-discovery-plugin.js` (Node JS plugin)
  - Responsibilities:
    - Discover `src/components/**/feature.meta.ts` and `src/components/**/feature.module.ts`
    - Load metadata modules (in Node) and validate against types
    - Build in-memory model of Features and Routes
    - On success, emit:
      - `src/components.generated/features.registry.ts` (typed registry and computed navigation)
      - `src/components.generated/generated-features.module.ts` (NestJS DynamicModule that imports all discovered feature modules)
    - On validation errors, push readable compilation errors to block HMR/build

- [X] T005 [P] Wire plugin into HMR webpack config
  - File: `webpack-hmr.config.js`
  - Add `new (require('./build/feature-discovery-plugin'))({ rootDir: __dirname })`
  - Ensure plugin runs before TS compilation so generated files exist for the same build

- [X] T006 [P] Add safe bootstrap import of generated module
  - File: `src/app.module.ts`
  - Import `GeneratedFeaturesModule` from `./components.generated/generated-features.module`
  - Include it in `imports: [...]` after core/system modules
  - Ensure build works even when no features discovered (generate empty module fallback)

- [X] T007 Left navigation consumes registry instead of hardcoding
  - File: `src/systemComponents/core/ui/LeftMenu.tsx`
  - Replace hardcoded `menuItems` with data sourced from `features.registry.ts`
  - Implement sort by `order` ascending then `label` as per spec
  - Preserve existing core entries (Welcome/About) and append feature entries

<!-- CSS scoping tasks removed intentionally -->

- [X] T008 [P] Contracts mapping reference
  - Map `contracts/features.openapi.json` → discovery ensures declared SSR `GET /<route>` are registered and served
  - Note: Contract tests added in user story phases

Checkpoint: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Add a new feature by adding a folder (Priority: P1) 🎯 MVP

Goal: Developer adds `src/components/<feature-id>/` with metadata, module, controller, UI; build discovers it and registers routes and nav automatically.

Independent Test: Run dev server with watch/HMR. Create `src/components/demo/` with required files. After incremental rebuild, visit `/demo` and see page and nav (if declared). Removing the folder removes route/nav on next rebuild.

### Tests for User Story 1 (TDD) ⚠️

- [X] T009 [P] [US1] Integration test: adding feature folder exposes route
  - File: `src/systemComponents/core/test/integration/feature-discovery.integration.spec.ts`
  - Start app; simulate presence of a minimal feature via a real fixture folder under `src/components/__fixtures__/demo` (no registry mocking). Run the actual discovery/codegen path and assert GET `/demo` returns 200 and contains page HTML.

- [X] T010 [P] [US1] Contract test: SSR route returns HTML
  - File: `src/systemComponents/core/test/contract/feature-route.contract.spec.ts`
  - Assert GET `/demo` responds `text/html` and contains `<!DOCTYPE html>` per `contracts/features.openapi.json` intent.

- [X] T010A [P] [US1] Integration test: removing/renaming feature removes route/nav
  - Within the same fixture setup, remove or rename `src/components/__fixtures__/demo` and trigger rebuild; assert `/demo` returns 404 and nav entry disappears after the next rebuild.

### Implementation for User Story 1

- [X] T011 [P] [US1] Scaffold minimal example feature for docs/tests
  - Files under: `src/components/demo/`
    - `feature.meta.ts` exporting `featureMeta: FeatureMeta`
    - `feature.module.ts` exporting a Nest module
    - `feature.controller.ts` with `@Get('/demo')` SSR handler using `renderPage`
    - `ui/DemoPage.tsx` and optional `ui/demo.css`

- [X] T012 [US1] Registry generation: emit discovered routes and nav entries
  - File: `src/components.generated/features.registry.ts` (generated)
  - Export: `features`, `navigation` arrays with proper types

- [X] T013 [US1] GeneratedFeaturesModule aggregates feature modules
  - File: `src/components.generated/generated-features.module.ts` (generated)
  - Export: `GeneratedFeaturesModule` with `@Module({ imports: [ ...featureModules ] })`

- [X] T014 [US1] LeftMenu integration reads `navigation` from registry
  - Ensure nav link for Demo appears with correct label/order when `nav` present

Checkpoint: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 — Iterate on a feature in isolation (Priority: P2)

Goal: Editing files inside a feature folder updates content, metadata, styles, tests via HMR rebuilds; no external file edits required.

Independent Test: Change metadata title/description and confirm updates on next rebuild; update UI/styles and see reflected output. Tests inside feature folder discovered automatically.

### Tests for User Story 2 (TDD) ⚠️

- [X] T015 [P] [US2] Integration: metadata change updates page title and nav label
  - Modify `demo/feature.meta.ts` in test and assert updated values appear after rebuild.

- [X] T016 [P] [US2] Test discovery: tests under feature folder are executed
  - Place `src/components/demo/test/*` and verify they run with repository’s Jest config without extra setup.
  - Accepted naming patterns: `**/test/**/*.(spec|test).ts` for Node tests and `**/test/**/*.(spec|test).tsx` for React UI tests
  - Ensure Jest config includes:
    - Node: `<rootDir>/src/components/**/test/**/*.(spec|test).ts`
    - React: `<rootDir>/src/components/**/test/**/*.(spec|test).tsx`

### Implementation for User Story 2

- [X] T017 [P] [US2] HMR context invalidation on add/remove/rename
  - Plugin: ensure changes in `feature.meta.ts`/`feature.module.ts` trigger regeneration

- [X] T018 [US2] Nav sort stability and determinism
  - Implement stable sort for `navigation` by `order`, then `label` per spec; add unit coverage if needed.

Checkpoint: User Story 2 independently testable and complete.

---

## Phase 5: User Story 3 — Safe validation and helpful errors (Priority: P3)

Goal: Build fails fast with clear messages when metadata invalid, duplicate route paths, multiple primaries, or missing required fields.

Independent Test: Introduce specific errors and verify compilation fails with actionable diagnostics including feature id, file path, and field name; HMR update is blocked.

### Tests for User Story 3 (TDD) ⚠️

- [X] T019 [P] [US3] Duplicate route path validation fails with conflict list
  - Create two fixtures with same route; expect webpack compilation error to include both feature ids and the route.

- [X] T020 [P] [US3] Schema validation: missing required fields
  - Omit `id` or `routes` in a fixture; expect error pointing to file/field with guidance.

- [X] T021 [P] [US3] Multiple `isPrimary=true` rejected
  - Expect descriptive error referencing feature and fields.

### Implementation for User Story 3

- [X] T022 [US3] Implement validation in plugin per data-model.md
  - Unique `feature.id`
  - Unique route `path` across all features
  - Exactly one or zero primary route per feature (error on multiple)
  - Optional `nav` produces a single entry linked to primary route only

- [X] T023 [US3] Human-readable diagnostics and error surfacing
  - Push errors to webpack `compilation.errors` with file/field references and fix hints; ensure non-zero build exit in CI.

Checkpoint: User Story 3 independently testable and complete.

---

## Phase N: Polish & Cross-Cutting Concerns

Purpose: Improvements affecting multiple user stories and documentation updates.

- [X] T024 [P] Documentation updates in `docs/` (usage and internals)
  - Update `docs/UI_ASSETS_MANAGEMENT_GUIDE.md` with a short section on using assets within component-scoped features (co-location, URLs under `/assets/`); link to example feature.
  - Update `docs/UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md` with a note about how generated routes and SSR still rely on Express static `/assets/` mapping; confirm webpack rules.
  
  - Update `docs/HOT_RELOAD_IMPLEMENTATION.md` to mention that the discovery/codegen plugin surfaces validation errors as webpack compilation errors that block HMR.

- [X] T025 [P] Developer Guide: How to add a drop-in feature
  - Add new doc: `docs/FEATURES_DISCOVERY_GUIDE.md` (how to use it — steps from quickstart, required files, metadata schema, troubleshooting)

- [X] T026 [P] Implementation Notes: How discovery works
  - Add new doc: `docs/FEATURES_DISCOVERY_IMPLEMENTATION.md` (how it works — plugin overview, generation outputs, validation rules, HMR behavior)

- [X] T027 Performance check at scale
  - Script or doc note to measure discovery time with 50–100 features; ensure under 3s incremental rebuilds per SC-002.
  - Created `build/performance-test.js` for automated performance testing
  - Documented results in `docs/PERFORMANCE_TEST_RESULTS.md`
  - Results: 103ms for 100 features (96.6% under 3s requirement)

- [X] T028 Code cleanup and comments
  - Add JSDoc/TSDoc on generated types and plugin functions; ensure readability.

- [X] T029 [P] Quickstart validation
  - Verify `/specs/001-as-the-project/quickstart.md` steps remain accurate with final implementation; update if required.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies — can start immediately
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational phase completion
  - Stories can proceed in parallel after foundation, but prioritize in order: P1 → P2 → P3
- Polish (Final Phase): Depends on desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational — No dependencies on other stories
- User Story 2 (P2): Can start after Foundational — Independent; relies on plugin HMR invalidation
- User Story 3 (P3): Can start after Foundational — Independent; extends plugin with validations

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models/types before services/plugins
- Plugin/registry before endpoints/nav consumption
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Foundational tasks T005 and T006 can run in parallel after T004 starts; T007 depends on T004/T005
- Tests within a user story marked [P] can run/written in parallel
- Different user stories can be worked on in parallel by different team members once foundation is done

---

## Parallel Example: User Story 1

- In parallel:
  - T009 Integration test skeleton
  - T010 Contract test skeleton
  - T011 Demo feature scaffold

Sequence:
1) Complete T004–T006 (foundation) → 2) Run T009/T010 (should fail) → 3) Implement T011–T013 → 4) Re-run tests (should pass) → 5) T014 LeftMenu integration

---

## Implementation Strategy

MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Test User Story 1 independently
5. Demo/merge as MVP

Incremental Delivery
1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo
3. Add User Story 2 → Test independently → Demo
4. Add User Story 3 → Test independently → Demo

Parallel Team Strategy
1. Team completes Setup + Foundational together
2. After Foundational:
   - Dev A: US1 (scaffold demo + registry)
   - Dev B: US2 (HMR behavior + metadata reflection)
   - Dev C: US3 (validation errors/tests)

---

## Report

Output path: `/home/gza/work/tests/monobackend/specs/001-as-the-project/tasks.md`

Summary
- Total task count: 29
- Task count per user story:
  - US1: 6 (T009–T014)
  - US2: 4 (T015–T018)
  - US3: 5 (T019–T023)
- Parallel opportunities identified: T001, T002, T003, T005, T006, T008, T009, T010, T015, T016, T017, T024, T025, T026, T029
- Independent test criteria for each story included under each phase
- Suggested MVP scope: User Story 1 (Phase 3)
