# Research: Component-Level Database Integration

**Feature**: `002-as-an-end` | **Date**: 2025-10-21

## Overview

This document captures research findings for implementing component-level database integration using Prisma's multi-file schema feature. The primary goal is to enable third-party components to define their own database schemas while maintaining a centralized, type-safe Prisma Client.

## Key Technologies

### 1. Prisma Multi-File Schema Support

**Decision**: Use Prisma's native multi-file schema feature (GA since v6.7.0)

**Rationale**:
- **Native support**: Prisma v6.7.0+ natively supports multiple schema files in a `prisma/schema/` directory
- **Automatic merging**: Prisma CLI automatically discovers and merges all `.prisma` files during `prisma generate` and `prisma migrate`
- **No custom tooling**: Eliminates the need for custom schema concatenation/merging logic
- **Standard workflow**: Developers can use standard Prisma CLI commands without modification

**Alternatives considered**:
1. **Custom schema concatenation**: Manually merge component schemas into a single file
   - Rejected: Fragile, requires custom parsing, error-prone, doesn't handle conflicts well
2. **Multiple Prisma Clients**: Generate separate Prisma Client for each component
   - Rejected: Complex cross-component queries, multiple database connections, harder to manage migrations

**Implementation approach**:
- Component schemas located at `src/components/*/prisma/schema.prisma` contain only models and enums
- Build process copies schemas to `prisma/schema/{component-name}.prisma`
- Build process generates `prisma/schema/main.prisma` with datasource and generator blocks
- Standard `prisma generate` and `prisma migrate` commands work out of the box

**References**:
- [Prisma Multi-File Schema Documentation](https://www.prisma.io/docs/orm/prisma-schema/overview/location#multi-file-prisma-schema)
- [Prisma 6.7.0 Release Notes](https://github.com/prisma/prisma/releases/tag/6.7.0)

---

### 2. Build-Time Schema Discovery

**Decision**: Use Webpack's `require.context` API to discover component schemas during build

**Rationale**:
- **Existing pattern**: Project already uses Webpack for component discovery (001 feature)
- **Consistency**: Reuses the same discovery mechanism for database schemas
- **Performance**: Discovery happens at build time, not runtime
- **Simplicity**: Straightforward glob-based file discovery

**Alternatives considered**:
1. **Node.js filesystem scanning**: Use `fs.readdir` to scan for schema files
   - Not rejected, but Webpack approach is more consistent with existing architecture
2. **Explicit registration**: Require components to register schemas in metadata
   - Rejected: More boilerplate, error-prone, less discoverable

**Implementation approach**:
- Extend existing component discovery plugin to also discover `prisma/schema.prisma` files
- Copy discovered schemas to `prisma/schema/` during build process
- Generate `main.prisma` with datasource and generator configuration

---

### 3. Database Connection Management

**Decision**: Use environment variables for database connection strings, following twelve-factor app methodology

**Rationale**:
- **Standard practice**: Widely accepted pattern for configuration management
- **Security**: Credentials not hardcoded in source code or schemas
- **Flexibility**: Different environments (dev, test, prod) can use different databases
- **Prisma native**: Prisma natively supports `env("VARIABLE_NAME")` syntax in datasource blocks

**Alternatives considered**:
1. **Configuration files**: Store credentials in JSON/YAML files
   - Rejected: Risk of committing credentials to version control
2. **Secrets management service**: Use Vault, AWS Secrets Manager, etc.
   - Not rejected for production, but overkill for development; can be layered on top

**Implementation approach**:
- `DATABASE_URL` environment variable for runtime connections
- `MIGRATION_DATABASE_URL` environment variable for migration operations (optional, allows different permissions)
- Generated `main.prisma` includes: `url = env("DATABASE_URL")`
- `.env` file for local development (gitignored)
- Docker Compose configuration provides database for local development

---

### 4. Migration Workflow

**Decision**: Use standard Prisma migration commands, requiring manual execution in development

**Rationale**:
- **Explicit control**: Developers must consciously apply migrations before running the server
- **Safety**: Prevents accidental schema changes in production-like environments
- **Standard tooling**: No custom migration orchestration needed
- **Clear separation**: Build process handles schema compilation; developers handle migration execution

**Alternatives considered**:
1. **Automatic migrations in dev**: Run `prisma migrate dev` automatically during HMR
   - Rejected: Can cause unexpected database changes, difficult to recover from errors
2. **Manual migrations everywhere**: Require manual execution even in development
   - Not rejected; this is the chosen approach
3. **Migration-on-start**: Apply migrations when dev server starts
   - Rejected: Slows startup, can cause failures if migrations fail

**Implementation approach**:
- Developers run `prisma migrate dev` explicitly before starting dev server
- CI/CD pipeline runs `prisma migrate deploy` for production deployments
- Documentation clearly specifies the workflow
- Build process only handles schema discovery and compilation, not migration execution

**Development workflow**:
1. Developer modifies component schema at `src/components/demo/prisma/schema.prisma`
2. Developer runs `npm run build` (or build process runs via HMR)
3. Schemas copied to `prisma/schema/`, client regenerated
4. Developer runs `npx prisma migrate dev --name add_feature`
5. Developer starts/continues dev server

---

### 5. Testing Strategy

**Decision**: Use Jest with separate test databases for integration tests

**Rationale**:
- **Existing infrastructure**: Project already uses Jest
- **Isolation**: Each test suite can use its own database or schema
- **Standard patterns**: Well-established patterns for testing Prisma applications

**Testing approach**:
1. **Unit tests**: Test schema discovery and copying logic without database
2. **Integration tests**: Test Prisma Client usage with real database
3. **Build tests**: Verify schema compilation and client generation

**Test database strategies**:
- Use `DATABASE_URL` environment variable pointing to test database
- Option 1: Single test database with transaction rollback per test
- Option 2: Docker container per test suite (slower but more isolated)
- Option 3: In-memory SQLite for fast tests (limited - not all PostgreSQL features)

**Implementation approach**:
- Test utilities in `src/database/test-utils/` for common test setup
- Integration tests in `tests/integration/database/`
- Demo component includes test examples in `src/components/demo/test/integration/`

---

## Best Practices

### Component Schema Guidelines

**Schema structure**:
```prisma
// src/components/demo/prisma/schema.prisma
// NO datasource block
// NO generator block
// ONLY models and enums

model DemoUser {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     DemoPost[]
}

model DemoPost {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String
  author    DemoUser @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum DemoPostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Generated main.prisma**:
```prisma
// prisma/schema/main.prisma
// Generated by build process - DO NOT EDIT MANUALLY

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

---

### Prisma Client Usage in Components

**Import pattern**:
```typescript
import { PrismaClient } from '@prisma/client';

// In NestJS module
import { PrismaService } from '@/database/prisma.service'; // Singleton service

// Usage in controller or service
constructor(private prisma: PrismaService) {}

async getUsers() {
  return this.prisma.demoUser.findMany();
}
```

**Dependency injection**:
- Create a `PrismaService` in `src/database/runtime/prisma.service.ts`
- Register as global provider for all components to use
- Follows NestJS best practices

---

### Error Handling

**Common error scenarios**:

1. **Duplicate model names**: Prisma will fail with clear error message
   - Solution: Rename conflicting models to resolve the conflict

2. **Invalid schema syntax**: Prisma will fail during `prisma generate`
   - Solution: Provide clear error messages from build process

3. **Database connection failure**: Prisma Client will throw connection errors
   - Solution: Validate `DATABASE_URL` environment variable at startup

4. **Migration conflicts**: Multiple developers creating migrations
   - Solution: Standard Git workflow for resolving migration conflicts

**Implementation approach**:
- Build process should surface Prisma errors without obscuration (FR-006)
- Provide helpful error messages for common issues
- Documentation includes troubleshooting section

---

## Integration Points

### With Existing Component Discovery (001 Feature)

The existing component discovery system (from feature 001) already discovers components and their metadata. This feature extends that system to also discover database schemas.

**Extension approach**:
1. Modify `build/component-discovery-plugin.js` to also look for `prisma/schema.prisma` files
2. Copy discovered schemas to `prisma/schema/` directory
3. Generate `main.prisma` with datasource and generator blocks
4. Run `prisma generate` as part of build process

**No breaking changes**: Existing components without database schemas continue to work normally.

---

### With NestJS Module System

Components are NestJS modules. The Prisma Client should be available to all components through dependency injection.

**Integration approach**:
1. Create `PrismaService` extending `PrismaClient` with NestJS lifecycle hooks
2. Register `PrismaService` as a global provider in root module
3. Components inject `PrismaService` in their controllers/services
4. Follows standard NestJS patterns

---

### With Hot Module Replacement (HMR)

When component schemas change during development with HMR:

1. Webpack detects schema file change
2. Build process re-runs schema discovery and copying
3. `prisma generate` regenerates client with new schema
4. **Developer must manually run `prisma migrate dev`** to update database
5. HMR reloads affected modules

**Important**: HMR does NOT automatically apply migrations. This is intentional for safety.

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@prisma/client": "^6.7.0"
  },
  "devDependencies": {
    "prisma": "^6.7.0"
  }
}
```

### Version Requirements

- **Prisma**: >= 6.7.0 (for multi-file schema support in GA)
- **PostgreSQL**: >= 12 (Prisma supported versions)
- **Node.js**: >= 18 (already required by NestJS 11)
- **TypeScript**: >= 5.0 (already using 5.9)

---

## Security Considerations

### Database Credentials

- **Environment variables only**: Never hardcode credentials
- **Gitignore `.env`**: Prevent accidental commits
- **Separate environments**: Different credentials for dev, test, prod
- **Principle of least privilege**: Use database users with minimal required permissions

### SQL Injection

- **Prisma provides protection**: Parameterized queries by default
- **No raw SQL in demo**: Show best practices using Prisma's type-safe API
- **Document safe patterns**: If raw SQL is needed, use Prisma's `$queryRaw` with parameter binding

### Access Control

- **Database-level**: Use PostgreSQL roles and permissions
- **Application-level**: Implement authorization in component logic (separate concern)
- **Row-level security**: Can be used with Prisma (document as advanced pattern)

---

## Performance Considerations

### Build Time

- Schema discovery: O(n) where n = number of components (~10-50 expected)
- Schema copying: Fast file operations
- `prisma generate`: ~5-30 seconds depending on schema complexity
- **Total build overhead**: ~5-30 seconds per build

### Runtime

- **No overhead**: Prisma Client is standard generated code
- **Connection pooling**: Configure via Prisma connection URL parameters
- **Query performance**: Standard Prisma Client performance characteristics

---

## Documentation Requirements

### For Component Developers

1. **Quickstart guide**: How to add database to a component
2. **Schema guidelines**: Best practices for defining schemas
3. **Prisma Client usage**: Import and dependency injection patterns
4. **Migration workflow**: Step-by-step guide for dev and prod
5. **Testing patterns**: How to test database code
6. **Troubleshooting**: Common errors and solutions

### For Platform Maintainers

1. **Build process overview**: How schema discovery and compilation works
2. **Migration strategy**: How to handle migrations in CI/CD
3. **Database provisioning**: Setting up PostgreSQL for different environments
4. **Monitoring**: Database performance and error tracking

---

## Risks and Mitigations

### Risk 1: Schema Conflicts

**Risk**: Multiple components define models with the same name

**Likelihood**: Medium

**Impact**: High (build failure, blocking development)

**Mitigation**:
- Good error messages when conflicts occur
- Developers must resolve conflicts when they arise

---

### Risk 2: Migration Conflicts

**Risk**: Multiple developers create migrations simultaneously

**Likelihood**: Medium (common in team development)

**Impact**: Medium (merge conflicts in migration files)

**Mitigation**:
- Standard Git workflow for resolving conflicts
- Clear documentation on migration best practices
- Consider migration naming strategies (timestamp-based, already built into Prisma)

---

### Risk 3: Database Connection Issues

**Risk**: Invalid or missing `DATABASE_URL` environment variable

**Likelihood**: High (common in local development setup)

**Impact**: Medium (runtime errors, but clear error messages)

**Mitigation**:
- Validate environment variables at application startup
- Provide helpful error messages
- Document setup steps clearly
- Include `.env.example` file

---

### Risk 4: Accidental Production Migrations

**Risk**: Developer accidentally runs migrations against production database

**Likelihood**: Low (requires production credentials in local environment)

**Impact**: Critical (data loss, downtime)

**Mitigation**:
- Separate credentials for dev and prod
- Require explicit environment variable for production migrations
- CI/CD pipeline handles production migrations
- Document safe practices

---

## Open Questions

None remaining. All clarifications were resolved during spec refinement.

---

## References

- [Prisma Multi-File Schema](https://www.prisma.io/docs/orm/prisma-schema/overview/location#multi-file-prisma-schema)
- [Prisma Client in NestJS](https://docs.nestjs.com/recipes/prisma)
- [Prisma Testing Guide](https://www.prisma.io/docs/orm/prisma-client/testing)
- [Twelve-Factor App - Config](https://12factor.net/config)
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)
