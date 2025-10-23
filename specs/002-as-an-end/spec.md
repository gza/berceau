# Feature Specification: Component-Level Database Integration

**Feature Branch**: `002-as-an-end`  
**Created**: 2025-10-15  
**Status**: Draft  
**Input**: User description: "As an end-developer, I need to be able to use a database in my components. The schema definitions are stored in the component. A centralized Prisma client is generated from all schemas, and standard Prisma commands manage migrations."


## Clarifications

### Session 2025-10-21

- Q: In a development environment with HMR, when should database migrations be applied during the development workflow? → A: Manual only - developers must run `prisma migrate dev` explicitly in terminal before running the dev server
- Q: When multiple component schemas define models with conflicting names, how should the system handle this? → A: Prisma generate will fail so the build process
- Q: Where should the unified Prisma schema and generated client be located in the project structure? → A: Project root `prisma/` directory (standard Prisma convention)
- Q: What is the expected location pattern for component Prisma schema files within a component's directory? → A: component/prisma/schema.prisma
- Q: How should the system handle database connection configuration (DATABASE_URL) during the build process when merging component schemas? → A: Environment variable reference - schema uses `env("DATABASE_URL")` pattern
- Q: When merging multiple component Prisma schema files into a single unified schema, how should the `datasource` and `generator` blocks be handled? → A: Use Prisma's native multi-file schema feature - component schemas contain only models/enums, copied to `prisma/schema/{component-name}.prisma`; build system creates `prisma/schema/main.prisma` with datasource and generator blocks

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Component Database Schema Definition and Build Integration (Priority: P1)

As a component developer, I define my component's database schema with a Prisma schema file within the component's directory, and during the build process all component schemas are collected into a central location and a single unified Prisma Client is generated, so that I can evolve my component's data model with version-controlled schema changes while having type-safe database access through the centralized client.

**Why this priority**: This is the foundation of the feature - schema definition and client generation are the minimum viable capability needed to use databases in components. The centralized approach simplifies the architecture by using standard Prisma tooling.

**Independent Test**: Can be fully tested by creating multiple components with Prisma schema files, running the build process, and verifying that all schemas are collected in a central directory and a single Prisma Client is generated with models from all components accessible.

**Acceptance Scenarios**:

1. **Given** components with Prisma schema files in their directories, **When** the build process runs, **Then** all schema files are discovered and copied to a central Prisma directory
2. **Given** schemas collected in the central directory, **When** the build completes, **Then** a single unified Prisma Client is generated containing all models from all components
3. **Given** a component with a modified Prisma schema, **When** I rebuild, **Then** the central schema is updated and the Prisma Client is regenerated
4. **Given** the generated Prisma Client, **When** I import it in component code, **Then** I have type-safe access to all database models with proper TypeScript types and IDE auto-completion

---

### User Story 2 - Database Access in Component Code and Tests (Priority: P2)

As a component developer, I can import and use the centralized Prisma Client in both my component code and tests, so that I can perform database operations with a consistent, type-safe interface across production and test environments.

**Why this priority**: While important for practical use, this is mainly about documentation and examples since the Prisma Client is a standard import. The core functionality is already provided by the generated client.

**Independent Test**: Can be fully tested by writing component code and tests that import the centralized Prisma Client, perform database operations, and verify the results.

**Acceptance Scenarios**:

1. **Given** the generated centralized Prisma Client, **When** I import it in component code, **Then** I can perform database operations using type-safe methods
2. **Given** an integration test file, **When** I import the centralized Prisma Client, **Then** I can use it to set up test data and verify database state
3. **Given** multiple concurrent tests, **When** tests run in parallel, **Then** each test can use the Prisma Client safely (isolation is handled by standard test patterns, not by the build system)

---

### Edge Cases

- What happens when a component's Prisma schema conflicts with another component's schema (e.g., same table name, duplicate model names)? (Resolved: Prisma's native `prisma generate` command will fail with standard error messages indicating the conflict, causing the build process to fail. Developers must resolve conflicts by renaming models.)
- What happens when the database credentials provided by the main app are invalid or change? (Resolved: Standard Prisma error messages will be shown)
- How does the system handle components with no Prisma schema? (Resolved: Components without schemas are ignored during collection)
- What happens when a component is removed but its tables still exist in the database? (Resolved: Standard Prisma migration workflow - developer must create a migration to drop the tables)
- What happens if the central Prisma directory is modified manually? (Expected: Build will overwrite with collected schemas on next build)
- How are database transactions handled across multiple components? (Resolved: Standard Prisma transaction API - developer's responsibility)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow component developers to define database schemas using Prisma schema language in the standard location `component/prisma/schema.prisma` within their component directory. Component schemas MUST contain only models and enums (no datasource or generator blocks).
- **FR-002**: System MUST discover all Prisma schema files from components during the build process
- **FR-003**: System MUST copy all discovered component Prisma schema files into `prisma/schema/{component-name}.prisma` at the project root, utilizing Prisma's native multi-file schema support (GA since Prisma v6.7.0)
- **FR-004**: System MUST generate a `prisma/schema/main.prisma` file containing the datasource and generator blocks with proper configuration using environment variable references (e.g., `env("DATABASE_URL")`) for connection strings
- **FR-005**: System MUST generate a single centralized Prisma Client from all schema files in `prisma/schema/` that is accessible to all components, leveraging Prisma's automatic file merging during `prisma generate`
- **FR-006**: System MUST report clear error messages all over the process. Errors from prisma native commands will be surfaced without obscuration.
- **FR-007**: System MUST use database credentials and connection information provided by the main application via environment variables (e.g., `DATABASE_URL`) in the centralized Prisma datasource configuration
- **FR-008**: System MUST regenerate the Prisma Client when any component schema changes and the build process runs
- **FR-009**: Developers MUST use standard Prisma CLI commands (`prisma migrate dev`, `prisma migrate deploy`, etc.) to manage migrations from the centralized schema. In development environments, migrations must be run manually via `prisma migrate dev` before starting the dev server.
- **FR-010**: System SHOULD provide documentation and examples in a `demo` component showing how to import and use the centralized Prisma Client in component code

### Key Entities

- **Component Prisma Schema**: A Prisma schema file located at `component/prisma/schema.prisma` within a component's directory that defines the component's database models and enums only (no datasource or generator blocks)
- **Central Prisma Schema Directory**: The `prisma/schema/` directory at the project root where all component schemas are copied during the build process, using Prisma's native multi-file schema support (GA since v6.7.0)
- **Main Schema File**: The `prisma/schema/main.prisma` file containing the datasource and generator blocks with environment variable references (e.g., `env("DATABASE_URL")`), created by the build system
- **Centralized Prisma Client**: The generated TypeScript client from all schema files in `prisma/schema/`, providing type-safe database access to all models from all components via Prisma's automatic file merging
- **Database Connection**: Configuration and credentials for accessing the database, provided via environment variables (e.g., `DATABASE_URL`) and referenced in the unified Prisma schema's datasource
- **Prisma Migrations**: Version-controlled database schema changes managed by standard Prisma CLI commands, stored in the central `prisma/` directory at project root

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Component developers can define a Prisma schema in their component directory and access all database models through the centralized Prisma Client with zero manual configuration beyond schema definition
- **SC-002**: Developers can use standard Prisma CLI commands (`prisma migrate dev`, `prisma migrate deploy`) without any custom tooling
- **SC-003**: The centralized Prisma Client provides full TypeScript IntelliSense support for all models from all components

## Assumptions

- The project uses Prisma ORM v6.7.0 or later (for native multi-file schema support in GA)
- The database system is PostgreSQL (Prisma's fully-supported database)
- Components follow the standard directory structure with Prisma schema files located at `component/prisma/schema.prisma`
- Component schema files contain only models and enums (no datasource or generator blocks)
- The main application has responsibility for database server provisioning and credential management
- Database connection credentials are provided via environment variables (e.g., `DATABASE_URL`) following standard Prisma and twelve-factor app conventions
- Developers are familiar with Prisma schema language and standard Prisma CLI commands
- The project uses a build process (e.g., Webpack, npm scripts) where schema copying and `prisma generate` steps can be integrated
- Database credentials configured via environment variables have sufficient permissions for the operations needed
- The `prisma/schema/` directory at project root is managed by the build system and should not be manually edited
- Standard Prisma migration workflow is acceptable (developers run `prisma migrate` commands manually before starting the dev server, or via CI/CD for deployments)
- Test isolation is handled by standard test patterns (e.g., database transactions, cleanup hooks) rather than by the build system
