# Implementation Plan: Component-scoped feature creation (drop-in components)

Branch: 001-as-the-project | Date: 2025-10-14 | Spec: /home/gza/work/tests/monobackend/specs/001-as-the-project/spec.md
Input: Feature specification from /specs/001-as-the-project/spec.md

Note: This plan is produced by the speckit workflow per .github/prompts/speckit.plan.prompt.md.

## Summary

Goal: Allow developers to add a fully self-contained feature by creating a single folder under src/components/<feature-id> containing metadata, a NestJS module with its own controller, UI, styles, and tests. The build pipeline (Webpack 5 + NestJS) discovers these features at compile time and generates a typed registry/aggregator module used to wire routes and navigation without editing files outside the feature folder. Validation happens during compilation; duplicates or schema violations fail the build and block HMR.

Technical approach: Use Webpack 5 context-based discovery and a small code-generation step to emit a generated FeaturesRegistry file and a GeneratedFeaturesModule (NestJS DynamicModule) that imports each feature’s NestJS module. Each feature provides:
- feature.meta.ts: typed const metadata (id, title, routes, optional nav.label/order)
- feature.module.ts: NestJS @Module with a controller exporting SSR handler(s)
- feature.controller.ts: NestJS controller that renders React page(s) via existing SSR utilities
- UI assets and tests within the same folder

## Technical Context

Language/Version: TypeScript 5.9, Node.js (NestJS 11), React 19
Primary Dependencies: NestJS core/common/platform-express, React (for SSR), Webpack 5, Jest (tests)
Storage: N/A (no persistence in this feature)
Testing: Jest + React Testing Library (SSR + page components), existing test harness
Target Platform: Linux server (Node.js), SSR with JSX
Project Type: Web server with server-rendered React pages (NestJS application)
Performance Goals: Discovery up to 100 features in < 3s during incremental rebuilds; deterministic ordering; zero runtime FS scans
Constraints: No runtime filesystem scanning; discovery/registration strictly at build time; HMR must not apply when validation errors exist
Scale/Scope: Single repo; up to 100+ features under src/components; one primary route per feature for nav, additional routes allowed

Open questions captured for Phase 0 research (now resolved in research.md):
- How to best implement compile-time discovery with Webpack 5 while keeping strong types? (Resolved)
- Best pattern to generate a NestJS DynamicModule and ensure AppModule always imports it without per-feature edits? (Resolved)
- How to surface validation as build errors that block HMR? (Resolved)

## Constitution Check

Gate I. Service-Oriented Architecture: PASS — Features are implemented as NestJS modules/services/controllers; business logic remains in services and is SSR-consumed.

Gate II. Server-Side Rendering (SSR) with JSX: PASS — Features expose pages rendered via existing SSR utilities using React 19 JSX.

Gate III. Future-Ready Service Extensions: PASS — Self-contained, pluggable modules under src/components prepare for future extension system.

Gate IV. Test-Driven Development (TDD): PASS — Each feature folder contains local tests; plan mandates tests for discovery/validation and an example feature.

Re-check after Phase 1: Still PASS.

## Project Structure

### Documentation (this feature)

```
/home/gza/work/tests/monobackend/specs/001-as-the-project/
├── plan.md              # This file (speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (schemas/contract docs)
```

### Source Code (repository root)

Non-exhaustive, relevant areas for this feature pattern:

```
/home/gza/work/tests/monobackend/src/
├── components/
│   └── <feature-id>/
│       ├── feature.meta.ts           # typed const metadata
│       ├── feature.module.ts         # @Module({ controllers: [FeatureController] })
│       ├── feature.controller.ts     # @Controller with SSR routes
│       ├── ui/                       # React SSR components + styles
│       └── test/                     # Unit/integration tests
├── systemComponents/                 # Existing system pages/modules
├── ssr/                              # SSR helpers
└── components.generated/             # GENERATED (git-ignored)
    ├── features.registry.ts          # GENERATED: typed registry of discovered features
    └── generated-features.module.ts  # GENERATED: NestJS DynamicModule aggregating features
```

Structure Decision: Single NestJS app with SSR. Features are autonomous NestJS modules living under src/components. A generated DynamicModule wires them into the application without editing external files. Registration and validation are performed at build time by a Webpack-powered codegen step.

## Complexity Tracking

No constitution violations expected. Code generation is justified to satisfy FR-002/FR-003/FR-012 and to maximize use of native NestJS module wiring with strong types and build-time validation.
