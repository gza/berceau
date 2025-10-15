# Feature Specification: Component-scoped feature creation (drop-in components)

**Feature Branch**: `001-as-the-project`  
**Created**: 2025-10-14  
**Status**: Draft  
**Input**: User description: "As the project is a framework, I would like to add features just by adding a new component into src/components without touching a file outside of its src/components/example. In order to illustrate I already added such dir. It is acceptable to modify it."

## Clarifications

### Session 2025-10-14

- Q: How should global navigation order be determined when multiple features provide navigation labels? → A: Explicit numeric order field in feature metadata; missing → append at end.
- Q: What is the canonical component metadata file format and placement? → A: TypeScript file `component.meta.ts` exporting a typed const.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a new feature by adding a folder (Priority: P1)

As a developer, I can add a new feature by creating a single self-contained folder under `src/components/<feature-name>` that includes a minimal set of files (metadata, page template, styles, tests). After saving, the build pipeline (NestJS CLI + Webpack) discovers the feature during compilation and generates the necessary registration so its page(s) become accessible via the defined path, without editing any files outside that folder. In watch/HMR mode, this happens on the next incremental rebuild without a manual server restart.

**Why this priority**: This delivers the core value: fast, low-friction feature addition with clear boundaries and high maintainability.

**Independent Test**: Start from a clean repository state. Run the dev server with watch/HMR. Create `src/components/demo/` with the required files. Wait for the incremental build to complete. Navigate to the declared route. Verify the page works and appears in navigation (if declared). Remove the folder and verify the route/menu entry disappear after the next HMR rebuild.

**Acceptance Scenarios**:

1. Given no feature named "demo" exists, When the developer creates `src/components/demo/` with a valid metadata file declaring a route `/demo`, Then the build detects it during compilation (or the next HMR rebuild) and the system exposes `/demo` without requiring edits outside `src/components/demo/`.
2. Given a valid feature folder with a declared navigation label, When the build completes (initial or incremental), Then the navigation displays an entry for the feature that links to its primary route.
3. Given a valid feature, When the developer removes or renames its folder, Then the corresponding route(s) and navigation entry are removed on the next build/HMR rebuild without any manual changes elsewhere.

---

### User Story 2 - Iterate on a feature in isolation (Priority: P2)

As a developer, I can modify files inside a feature folder (content, metadata, styles, tests) and see changes reflected after the next HMR incremental rebuild, without touching other parts of the codebase.

**Why this priority**: Enables safe iteration and localized ownership; reduces coupling and review overhead.

**Independent Test**: Edit only files inside the feature folder and verify that updates are reflected (route title, content, styles) while no edits occur outside the folder.

**Acceptance Scenarios**:

1. Given a feature declares a title and description in its metadata, When those values are changed, Then after the next HMR rebuild the updated title/description appear in the rendered page and any navigation where applicable.
2. Given a feature includes localized tests under its folder, When the test suite runs, Then those tests are discovered and executed without additional configuration.

---

### User Story 3 - Safe validation and helpful errors (Priority: P3)

As a developer, if I make a mistake inside the feature folder (invalid metadata, duplicate route, missing required file), I receive a clear, actionable error at build time that points to the exact file and field, so I can fix it quickly. In dev watch/HMR mode, the Webpack build fails and no hot update is applied until the error is resolved.

**Why this priority**: Prevents silent failures and speeds up onboarding by making the pattern discoverable and self-documenting.

**Independent Test**: Introduce a specific error (e.g., duplicate route or missing required field) and verify the system reports it with a descriptive message including the feature name and offending field.

**Acceptance Scenarios**:

1. Given two features declare the same route path, When the build performs discovery during compilation, Then it fails validation with a message listing the conflicting features and route, and the build (and any hot update) does not complete until resolved.
2. Given a feature has an invalid or missing required field in its metadata, When the build performs discovery, Then it reports the field and file path and indicates acceptable values, and the build fails until fixed.

---

### Edge Cases

- Two features declare the same primary route path or navigation label → validation fails with a conflict report and guidance to resolve during build; no hot update is applied.
- A feature folder is missing its metadata file or required fields → validation fails with precise diagnostics; build fails.
 - A discoverable component folder (one containing `component.meta.ts` or `component.module.ts`) is missing required metadata fields → validation fails with precise diagnostics; build fails. Folders that only include tests and no `component.meta.ts`/`component.module.ts` are ignored by discovery without error.
- Feature defines multiple routes → all declared routes are registered; validation ensures each path is unique across all features.
- Feature is present but navigation label is intentionally omitted → route remains accessible via URL; no navigation entry is created.
- Feature folder contains tests only (no routes) → tests run but no routes/nav changes are made; these folders are not considered discoverable features and are ignored by feature discovery without error.
- Removing or renaming a feature folder → corresponding routes/nav entries are removed on the next build/HMR rebuild without manual cleanup.
- Large number of features (e.g., 100+) → discovery during compilation still completes within acceptable time (see Success Criteria) and remains deterministic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support self-contained features located under `src/components/<feature-id>` consisting of: a metadata file (feature name/id, routes, optional navigation label), a NestJS module and controller for SSR routing, a page template/content file, optional styles/assets, and optional tests.
- **FR-002**: The system MUST automatically discover all feature folders under `src/components` at build time during compilation (initial build and incremental rebuilds in watch/HMR), without requiring changes to files outside each feature’s folder.
- **FR-003**: The system MUST register all routes declared by a feature so they are accessible via the specified paths; this registration MUST be produced at build time (e.g., via a generated registry/module) and not rely on runtime filesystem scans.
- **FR-004**: If a feature declares a navigation label, the system MUST include a navigation entry that links to the feature’s primary route.
- **FR-005**: The system MUST validate discovered features and fail fast on conflicts or schema errors with clear, actionable error messages referencing the feature and field. Build MUST fail (preventing dev hot-update and production artifact emission) when validation errors occur (e.g., duplicate routes, invalid metadata), with diagnostics pointing to the offending files.
- **FR-006**: The system MUST prevent route path collisions across features by failing validation and reporting all conflicts detected.
- **FR-007**: The system MUST allow removing a feature by deleting or renaming its folder, which MUST remove its routes and navigation entry on the next build/HMR rebuild without manual edits elsewhere.
- **FR-008**: The system MUST allow tests stored inside the feature folder to be discovered and executed by the project’s test runner without extra configuration.
- **FR-009**: The system MUST provide a minimal, documented example feature (e.g., `src/components/example/`) demonstrating the pattern, which can be copied and adapted.
- **FR-010**: The system SHOULD provide human-readable diagnostics that include the feature id, file path, and field name when reporting validation errors, emitted by the build pipeline.
- **FR-011**: When multiple features provide navigation labels, the global navigation order MUST use an explicit numeric order field declared in each feature’s metadata; if the field is missing, the entry MUST be appended to the end.
- **FR-012**: The system MUST implement build-time discovery via the bundler (e.g., Webpack context) and/or a code-generation step that outputs a typed registry/module. Runtime filesystem scanning within the Node process is NOT allowed for discovery/registration.

### Dependencies & Assumptions

- Discovery is limited to `src/components/*` only; nested sub-features beyond one level are out of scope for this feature.
- Features are independent units; direct coupling between features (e.g., cross-feature imports) is discouraged and considered out of scope for this specification.
- A single "primary route" per feature is assumed for navigation purposes; features may declare additional routes that do not appear in navigation.
- Default behavior favors safety and clarity over implicit merging (e.g., collisions cause a visible error rather than silent override).
- Discovery is performed by the build pipeline (NestJS CLI + Webpack) at compile time. In watch/HMR mode, changes are applied via incremental rebuilds; no runtime directory scanning occurs.

### Key Entities *(include if feature involves data)*

- **Feature**: A self-contained unit providing user-facing functionality. Attributes: id (unique), name/title, optional description, folder path, status (valid/invalid), primary route, optional navigation label.
- **Route Definition**: Declares an accessible path and display properties for a feature page. Attributes: path (unique across features), title, isPrimary (boolean).
- **Navigation Entry**: An item in the application’s navigation. Attributes: label, target route path, order (number, optional; if missing the entry is appended to the end), visibility rules (optional).
- **Validation Result**: Outcome of discovery and checks. Attributes: feature id, severity, message, file/field reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can add a new feature by creating a single folder under `src/components` and see its primary page live without editing any external files, in under 5 minutes end-to-end (through the next HMR rebuild; no manual restart).
	- Note: Features may declare multiple routes/pages; beyond the primary page for navigation, additional declared routes must also be accessible.
- **SC-002**: Build-time discovery of up to 100 features completes in under 3 seconds on a typical developer machine, with deterministic results and consistent ordering (measured as part of incremental Webpack rebuilds).
- **SC-003**: 100% of route path collisions across features are detected and reported at build time; the build fails and no hot update is applied nor production artifact emitted.
- **SC-004**: At least 90% of new feature additions require zero changes outside the feature folder (exceptions documented only for extraordinary cases).
- **SC-005**: Tests located inside a feature folder are automatically discovered and executed by the test suite with no additional configuration (observed in CI and local runs).
- **SC-006**: Removing a feature folder results in complete removal of its routes and navigation entry on the next build/HMR rebuild, with no stale links or 404s in navigation.

---

## Implementation Notes (informative)

- Discovery/registration occurs during compilation via the NestJS CLI + Webpack pipeline. A bundler context import and/or small code-generation step can emit a typed registry used by routing and navigation. In watch/HMR mode, changes are reflected on the next incremental rebuild.
 - Failure behavior: Validation errors surface as compilation errors. In dev, the terminal shows diagnostics and HMR does not apply the broken change. In CI/prod builds, the process exits non-zero and no artifact is produced.
