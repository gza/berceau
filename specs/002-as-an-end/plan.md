# Implementation Plan: Component-Level Database Integration

**Branch**: `002-as-an-end` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-as-an-end/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Refer to `.github/prompts/speckit.plan.prompt.md` for the execution workflow.

## Summary

This feature enables component developers to define database schemas using Prisma schema files within their component directories. During the build process, all component schemas are collected into a central `prisma/schema/` directory, leveraging Prisma's native multi-file schema support (GA since v6.7.0). A single centralized Prisma Client is generated from all schemas, providing type-safe database access to all models from all components. Developers use standard Prisma CLI commands for migrations, with manual migration execution required in development before starting the dev server.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js (NestJS 11)  
**Primary Dependencies**: NestJS (modules, controllers, dependency injection, providers), Prisma ORM v6.7.0+, Webpack 5 (for build integration), Jest (tests)  
**Storage**: PostgreSQL (via Prisma ORM, using DATABASE_URL environment variable)  
**Testing**: Jest (unit + integration tests)  
**Target Platform**: Linux server (Node.js runtime)  
**Project Type**: Single monolithic web application with component-based architecture  
**Performance Goals**: Build-time schema discovery and compilation; runtime database access via standard Prisma Client (no additional overhead)  
**Constraints**: Must use Prisma v6.7.0+ for multi-file schema support; requires PostgreSQL; component schemas must be self-contained (models/enums only)  
**Scale/Scope**: Multiple components (10-50 expected), each with 0-20 database models; centralized schema in `prisma/schema/` directory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Service-Oriented Architecture**: ✅ PASS  
- This feature provides a build-time service (schema discovery & compilation) that components consume via the centralized Prisma Client
- The Prisma Client is a well-documented TypeScript API that components import and use
- No violation of service boundaries

**II. UI Server-Side Rendering (SSR) with JSX**: ✅ PASS  
- This feature is infrastructure-level (database access layer)
- Does not affect SSR implementation
- No conflict

**III. Component-Hosting Platform**: ✅ PASS  
- This feature directly supports the platform's goal of providing a reliable, well-documented environment for third-party components
- Components get type-safe database access through standard Prisma patterns
- Clear documentation will be provided in demo component

**IV. Test-Driven Development (TDD)**: ✅ PASS  
- Build process changes will be tested (schema discovery, copying, generation)
- Integration tests will verify Prisma Client usage in components
- Demo component will include test examples

**V. Security by Design**: ✅ PASS  
- Database credentials via environment variables (twelve-factor app pattern)
- No credential exposure in component code
- Prisma provides SQL injection protection
- Connection string security is delegated to standard Prisma practices

**Overall Assessment**: No constitution violations. All principles are respected.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── components/          # Third-party components (feature modules)
│   └── demo/           # Demo component with database usage
│       ├── component.module.ts
│       ├── component.controller.tsx
│       ├── component.meta.ts
│       ├── prisma/     # Component-specific database schema
│       │   └── schema.prisma  # Models/enums only (no datasource/generator)
│       ├── test/
│       │   └── integration/
│       └── ui/
├── database/           # Database tooling (existing from 001 feature)
│   ├── discovery/      # Schema file discovery logic
│   ├── generation/     # Prisma client generation orchestration
│   └── cli/           # CLI tools for database operations
└── components.generated/
    └── database/      # Build-time generated database artifacts
        └── clients/   # Generated Prisma clients per component (if needed)

prisma/                # Central Prisma directory (NEW)
├── schema/           # Multi-file schema directory (Prisma v6.7.0+)
│   ├── main.prisma  # Datasource & generator blocks (generated)
│   └── demo.prisma  # Copied from src/components/demo/prisma/schema.prisma
└── migrations/       # Standard Prisma migrations directory

tests/
├── integration/
│   └── database/     # Database integration tests
└── unit/
    └── database/     # Schema discovery & generation unit tests
```

**Structure Decision**: Single project structure is appropriate. This is a build-time infrastructure feature that integrates with the existing NestJS monolith. The `prisma/` directory at project root follows standard Prisma conventions. Component schemas are co-located with components in `src/components/*/prisma/schema.prisma`. The build process copies schemas to `prisma/schema/` and generates a single client.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations detected. This section is not applicable.

## Post-Design Constitution Re-check

*Re-evaluation after Phase 1 design completion*

**I. Service-Oriented Architecture**: ✅ PASS (CONFIRMED)
- Design confirms build-time service approach with clear separation
- `PrismaService` provides clean abstraction following NestJS patterns
- Components access database through well-defined TypeScript API
- No changes from initial assessment

**II. UI Server-Side Rendering (SSR) with JSX**: ✅ PASS (CONFIRMED)
- Database layer is completely separate from UI rendering
- Demo component shows integration with SSR controllers
- No impact on existing SSR implementation
- No changes from initial assessment

**III. Component-Hosting Platform**: ✅ PASS (CONFIRMED)
- Design delivers on promise of well-documented, secure environment
- Quickstart guide provides clear onboarding
- API contracts demonstrate usage patterns
- Demo component serves as reference implementation
- Strong support for third-party component development

**IV. Test-Driven Development (TDD)**: ✅ PASS (CONFIRMED)
- Testing strategy defined in research.md
- Unit test patterns shown in quickstart.md
- Integration test patterns documented
- Demo component will include comprehensive test suite
- No changes from initial assessment

**V. Security by Design**: ✅ PASS (CONFIRMED)
- Environment variable pattern confirmed in design
- `.env` gitignored to prevent credential leaks
- Separate `MIGRATION_DATABASE_URL` supports principle of least privilege
- Prisma's built-in SQL injection protection
- No credential exposure in generated code or schemas
- No changes from initial assessment

**Final Assessment**: Design phase complete. No constitution violations detected. All five principles remain satisfied. Ready to proceed to Phase 2 (tasks breakdown).

---

## Phase Completion Summary

### ✅ Phase 0: Research (COMPLETED)
- **Output**: `research.md` with all technical decisions documented
- **Key Decisions**:
  - Use Prisma v6.7.0+ multi-file schema feature
  - Webpack-based schema discovery (consistent with 001 feature)
  - Environment variables for database credentials
  - Manual migration workflow in development
  - Jest for testing with separate test databases
- **Status**: All "NEEDS CLARIFICATION" items resolved

### ✅ Phase 1: Design & Contracts (COMPLETED)
- **Outputs**:
  - `data-model.md`: Build-time and runtime entities documented
  - `contracts/`: Simple UI specification for demo component
  - `quickstart.md`: Developer onboarding guide
  - `.github/copilot-instructions.md`: Updated agent context
- **Key Artifacts**:
  - 10 build-time entities (schemas, metadata, migrations)
  - 2 runtime entities (Prisma Client, Prisma Service)
  - 2 demo models (DemoUser, DemoPost)
  - Simple UI specification (post list, add form, delete button)
- **Status**: Design complete and validated against constitution

### 🔄 Phase 2: Tasks Breakdown (NEXT STEP)
- **Command**: Run `/speckit.tasks` to generate `tasks.md`
- **Expected**: Detailed implementation tasks with dependencies and test requirements
- **Note**: This is NOT part of `/speckit.plan` command scope
