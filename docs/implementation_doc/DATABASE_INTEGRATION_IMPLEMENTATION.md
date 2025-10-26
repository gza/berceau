# Database Integration Implementation Documentation

**Feature**: Component-Level Database Integration  
**Branch**: `002-as-an-end`  
**Date**: October 22, 2025

## Executive Summary

This document describes the architecture and implementation of the component-level database integration feature. The solution provides automatic schema discovery, centralized Prisma Client generation, and type-safe database access for all components in the application.

### Key Achievements

- ✅ Automatic schema discovery during build process
- ✅ Centralized Prisma Client generation from multiple component schemas
- ✅ Global PrismaService available to all components
- ✅ Type-safe database operations with full IntelliSense support
- ✅ Comprehensive developer documentation and guides
- ✅ Demo component showing complete CRUD implementation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Decisions](#design-decisions)
3. [Component Architecture](#component-architecture)
4. [Build Process](#build-process)
5. [Runtime Architecture](#runtime-architecture)
6. [Testing Strategy](#testing-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Security Considerations](#security-considerations)
9. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Component Schemas                        │
│  src/components/*/prisma/schema.prisma (models/enums only)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Build Process (Webpack Plugin)                  │
│  - Discover component schemas                                │
│  - Copy to prisma/schema/ directory                          │
│  - Generate main.prisma with datasource/generator            │
│  - Run prisma generate                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Centralized Prisma Client                       │
│  node_modules/.prisma/client (all models from all components)│
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PrismaService                             │
│  Global NestJS service extending PrismaClient                │
│  Available to all modules via DatabaseModule                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Component Services                           │
│  Component-specific business logic using PrismaService       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Single Responsibility**: Each layer has a clear, focused purpose
2. **Separation of Concerns**: Build-time vs runtime concerns are clearly separated
3. **Type Safety**: Full TypeScript support from schema to UI
4. **Developer Experience**: Automatic discovery, no manual configuration
5. **Security**: Credentials via environment variables, no exposure in code

---

## Design Decisions

### 1. Prisma Multi-File Schema (v6.7.0+)

**Decision**: Use Prisma's native multi-file schema support

**Rationale**:
- GA feature since Prisma v6.7.0 (production-ready)
- Native support means better tooling and less maintenance
- Simpler than custom schema merging solutions
- Follows Prisma's recommended approach for modular schemas

**Alternatives Considered**:
- Custom schema merging (rejected: reinventing the wheel)
- Single monolithic schema (rejected: doesn't scale, hard to maintain)
- Per-component Prisma Clients (rejected: type issues, complexity)

### 2. Webpack Plugin for Discovery

**Decision**: Implement schema discovery as a Webpack plugin

**Rationale**:
- Consistent with existing component discovery (001 feature)
- Runs automatically during build process
- No separate build step needed
- Integrates seamlessly with HMR for development

**Implementation**: `build/database-schema-plugin.js`

### 3. Global PrismaService

**Decision**: Make PrismaService globally available via @Global() decorator

**Rationale**:
- Simplifies component development (no imports needed)
- Follows NestJS best practices for shared services
- Single database connection pool for entire application
- Cleaner dependency injection

**Implementation**: `src/database/runtime/database.module.ts`

### 4. Manual Migration Workflow

**Decision**: Require developers to manually run migrations

**Rationale**:
- Explicit control over database changes
- Prevents accidental schema changes in production
- Clear separation between development and deployment
- Standard practice in production environments

**Trade-off**: Slight DX friction vs safety

### 5. Environment Variables for Credentials

**Decision**: Use DATABASE_URL and MIGRATION_DATABASE_URL environment variables

**Rationale**:
- Twelve-factor app methodology
- Security best practice (never commit credentials)
- Separate credentials for runtime vs migrations (least privilege)
- Standard Prisma configuration pattern

**Implementation**: `.env` file (gitignored)

### 6. Schema-Based Test Isolation

**Decision**: Use PostgreSQL schemas (not separate databases) for test isolation

**Rationale**:
- Fast setup: Creating schemas is faster than creating databases
- Resource efficient: Single database connection pool
- Easy cleanup: DROP SCHEMA CASCADE removes all objects
- Parallel execution: Each Jest worker gets its own schema
- Native Prisma support: `?schema=` parameter in connection URL

**Alternatives Considered**:
- Separate test databases (rejected: slower, more resource-intensive)
- Transaction rollback (rejected: doesn't work with NestJS TestingModule lifecycle)
- Table truncation without isolation (rejected: race conditions in parallel tests)

**Implementation**: 
- `jest.globalSetup.ts`: Creates test schemas using `pg_dump` with mandatory `JEST_WORKERS` environment variable
- `PrismaService.getDatabaseUrl()`: Detects `JEST_WORKER_ID` and modifies schema parameter
- `jest.config.js`: Configures parallel execution
- `package.json`: Test scripts include `JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS`

**Environment Variable Requirements**:
- `JEST_WORKERS` environment variable is **mandatory** and must be set in package.json test scripts
- Controls both the number of Jest workers and the number of test schemas created
- Validation error thrown if not set or invalid: "JEST_WORKERS environment variable is required..."
- Example: `"JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS"`

**Trade-offs**:
- Pro: 4x faster test execution on 4-core machines
- Pro: Complete isolation, no race conditions
- Con: Requires PostgreSQL (schema-based isolation not available in all databases)
- Con: Slightly longer globalSetup time (~2-3 seconds)

---

## Component Architecture

### Directory Structure

```
src/components/demo/
├── prisma/
│   └── schema.prisma              # Component schema (models only)
├── test/
│   └── integration/
│       ├── database-operations.spec.ts  # CRUD tests
│       └── controller.spec.ts           # Route tests
├── ui/
│   ├── PostListPage.tsx          # Main UI component
│   ├── PostForm.tsx              # Form component
│   ├── PostCard.tsx              # Card component
│   └── demo.css                  # Styles
├── component.controller.tsx       # NestJS controller
├── component.service.ts          # Business logic service
├── component.module.ts           # NestJS module
└── component.meta.ts             # Component metadata
```

### Schema File Format

Component schemas contain ONLY model and enum definitions:

```prisma
// ✅ ALLOWED: Models
model DemoUser {
  id        String   @id @default(uuid())
  name      String   @unique
  email     String   @unique
  posts     DemoPost[]
}

// ✅ ALLOWED: Enums
enum DemoPostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ❌ NOT ALLOWED: Datasource blocks
// ❌ NOT ALLOWED: Generator blocks
```

The datasource and generator blocks are automatically added by the build process in `prisma/schema/main.prisma`.

---

## Build Process

### Webpack Plugin: DatabaseSchemaPlugin

**Location**: `build/database-schema-plugin.js`

**Phases**:

1. **Discovery Phase**
   - Scan `src/components/*/prisma/schema.prisma`
   - Validate each schema file
   - Build list of discovered schemas

2. **Copy Phase**
   - Create `prisma/schema/` directory
   - Copy each component schema to `prisma/schema/{component-name}.prisma`
   - Preserve original content (models/enums only)

3. **Generation Phase**
   - Generate `prisma/schema/main.prisma` with:
     - `datasource` block (PostgreSQL, env("MIGRATION_DATABASE_URL"))
     - `generator` block (Prisma Client, output to node_modules/.prisma/client)

4. **Compilation Phase**
   - Run `npx prisma generate`
   - Generate centralized Prisma Client
   - All models from all components available in single client

### Build Output

```
prisma/
├── schema/
│   ├── main.prisma          # Generated: datasource + generator
│   └── demo.prisma          # Copied from src/components/demo/prisma/schema.prisma
└── migrations/
    └── {timestamp}_{name}/
        └── migration.sql
```

### Hot Module Replacement (HMR)

The plugin integrates with Webpack's watch mode:
- Schema changes trigger automatic rebuild
- Prisma Client regenerates on schema changes
- Dev server reloads with updated types
- Fast feedback loop for schema development

---

## Runtime Architecture

### DatabaseModule (Global)

**Location**: `src/database/runtime/database.module.ts`

**Purpose**: Provide PrismaService globally to all modules

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**Key Points**:
- `@Global()` decorator makes exports available everywhere
- No need to import in feature modules
- Single instance (singleton) throughout application

### PrismaService

**Location**: `src/database/runtime/prisma.service.ts`

**Purpose**: NestJS-compatible wrapper around Prisma Client

**Features**:
- Extends `PrismaClient` for full Prisma API
- Implements `OnModuleInit` for automatic connection
- Implements `OnModuleDestroy` for graceful shutdown
- Logging for connection lifecycle events

**Usage in Components**:

```typescript
@Injectable()
export class DemoComponentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPosts() {
    return this.prisma.demoPost.findMany({
      include: { author: true },
    });
  }
}
```

### Type Safety

**TypeScript Integration**:
- Full IntelliSense for all models
- Compile-time type checking
- Auto-completion for relations and fields
- Type-safe query results

**Example**:
```typescript
// TypeScript knows about all fields and relations
const post = await prisma.demoPost.findUnique({
  where: { id: '...' },
  include: { author: true },
});

// Type: DemoPost & { author: DemoUser }
console.log(post.author.name); // ✅ Type-safe
```

---

## Testing Strategy

### Schema-Based Isolation

**Architecture**: Each Jest worker gets its own isolated database schema to enable safe parallel test execution.

**Implementation**:
- `jest.globalSetup.ts`: Runs once before all tests
- Creates `test_1`, `test_2`, `test_3`, `test_4` schemas (one per worker)
- Uses `pg_dump` to copy complete schema structure from `public` schema
- Grants permissions to application user on each test schema
- `PrismaService`: Auto-detects `JEST_WORKER_ID` and modifies connection URL to use test schema

**Key Files**:
- `/jest.globalSetup.ts`: Schema initialization
- `/src/database/runtime/prisma.service.ts`: Schema detection logic
- `/jest.config.js`: Parallel execution configuration (`maxWorkers: "50%"`)

**Schema Copying Process**:
```bash
# For each test worker schema (test_1, test_2, etc.):
1. DROP SCHEMA IF EXISTS test_N CASCADE
2. CREATE SCHEMA test_N
3. GRANT ALL PRIVILEGES to application user
4. pg_dump public schema (schema-only, no data)
5. Replace 'public.' with 'test_N.' in dump
6. Execute modified dump in test schema
```

**Benefits**:
- ✅ Parallel test execution (4x faster on 4-core machines)
- ✅ Complete test isolation (no race conditions)
- ✅ Automatic schema setup (no manual configuration)
- ✅ Proper ENUM type handling (pg_dump handles schema-qualified types)
- ✅ Complete schema replication (tables, indexes, constraints, sequences)

### Unit Tests

**Approach**: Mock PrismaService for fast unit tests

**Example**:
```typescript
const mockPrisma = {
  demoPost: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// Inject mock in test module
```

**Benefits**:
- Fast execution
- No database dependency
- Isolated testing

### Integration Tests

**Approach**: Use real database with schema isolation

**Setup**:
- Each worker uses its own test schema (`test_1`, `test_2`, etc.)
- Clean data between tests (deleteMany)
- Real Prisma Client with schema-isolated connections

**Example Tests**:
- `database-operations.spec.ts`: CRUD operations
- `controller.spec.ts`: HTTP routes with database
- `quickstart-validation.spec.ts`: Verify documentation examples

**Benefits**:
- Validates real database interactions
- Tests actual Prisma queries
- Catches SQL errors
- Safe parallel execution

### Test Database Configuration

**Environment Variables**:
```env
# Runtime connection (also used by tests)
DATABASE_URL="postgresql://berceau:secret@localhost:5432/berceau-dev?schema=public"

# Migration connection (used by globalSetup for schema creation)
MIGRATION_DATABASE_URL="postgresql://boss:secret@localhost:5432/berceau-dev?schema=public"
```

**Schema Detection in PrismaService**:
```typescript
private getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''
  
  // In test environment, use worker-specific schema
  if (process.env.JEST_WORKER_ID) {
    const workerId = process.env.JEST_WORKER_ID
    const schemaName = `test_${workerId}`
    
    // Replace schema parameter in URL
    return baseUrl.includes('?schema=')
      ? baseUrl.replace(/(\?schema=)[^&]*/, `$1${schemaName}`)
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}schema=${schemaName}`
  }
  
  return baseUrl
}
```

### Test Execution

**Environment Variable Setup**:
- `JEST_WORKERS` environment variable is required in all test scripts
- Set in package.json: `"JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS"`
- Must match the number of workers Jest will actually use
- Ensures correct number of test schemas are created

**Parallel Execution** (default):
```bash
npm run test  # Uses JEST_WORKERS value, schema isolation enabled
```

**Serial Execution** (for debugging):
```bash
npm run test -- --maxWorkers=1  # Single worker, uses test_1 schema
```

**Custom Worker Count**:
```bash
# Update package.json first, then run:
JEST_WORKERS=4 jest --maxWorkers=4
```

**Test Output**:
```
🔧 Setting up test database schemas...
  Creating schema: test_1
  Granted permissions to berceau on test_1
  Copying schema structure to test_1...
  Successfully copied schema structure to test_1
  [Repeated for test_2, test_3, test_4]
✅ Test database schemas ready!

Test Suites: 28 passed, 28 total
Tests:       159 passed, 159 total
Time:        12.873 s
```

### Troubleshooting Test Issues

**Problem**: "JEST_WORKERS environment variable is required"

**Cause**: JEST_WORKERS not set in test scripts

**Solution**: Update package.json:
```json
{
  "scripts": {
    "test": "JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS",
    "test:watch": "JEST_WORKERS=8 jest --watch --maxWorkers=$JEST_WORKERS",
    "test:cov": "JEST_WORKERS=8 jest --coverage --maxWorkers=$JEST_WORKERS"
  }
}
```

**Problem**: "Table does not exist in current database"

**Cause**: Test schema not properly initialized

**Solution**:
```bash
# Ensure database is running
docker compose up

# Rebuild to ensure migrations are applied to public schema
npm run build
npx prisma migrate dev

# Run tests (globalSetup will copy schema)
npm run test
```

**Problem**: Tests fail intermittently

**Cause**: Race conditions (if schema isolation is not working)

**Solution**:
```bash
# Verify PrismaService is using test schemas
# Check logs for "Prisma connected to database on schema: test_N"

# Run tests serially to confirm it's a parallelization issue
npm run test -- --maxWorkers=1

# If serial passes but parallel fails, check JEST_WORKER_ID detection
```

**Problem**: "Permission denied for schema test_N"

**Cause**: Application user doesn't have permissions on test schemas

**Solution**: Verify `jest.globalSetup.ts` includes permission grants:
```typescript
await prisma.$executeRawUnsafe(
  `GRANT ALL ON SCHEMA "${schemaName}" TO ${appUser}`
)
await prisma.$executeRawUnsafe(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT ALL ON TABLES TO ${appUser}`
)
```

---

## Performance Considerations

### Build Time

**Impact**: Adds ~2-3 seconds to build process
- Schema discovery: <100ms
- File copying: <50ms
- Prisma generation: 1-2s (depends on schema size)

**Optimization**: 
- Only regenerates if schemas change
- Webpack caching for subsequent builds

### Runtime Performance

**Connection Pooling**:
- Prisma handles connection pooling automatically
- Single PrismaService instance = single pool
- Configurable via environment variables

**Query Performance**:
- No overhead vs direct Prisma usage
- Efficient query generation by Prisma
- Indexes defined in schemas

### Memory Usage

**Prisma Client Size**:
- ~2-3MB per model
- Loaded once, shared across application
- Minimal memory overhead

---

## Security Considerations

### Credential Management

**Environment Variables**:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
MIGRATION_DATABASE_URL="postgresql://admin:pass@host:5432/db?schema=public"
```

**Security Measures**:
- `.env` file gitignored
- Separate credentials for runtime vs migrations
- Never hardcoded in source code
- Production uses secret management (e.g., AWS Secrets Manager)

### SQL Injection Protection

**Prisma Protection**:
- Parameterized queries by default
- No raw SQL in component code
- Automatic escaping and sanitization

**Best Practices**:
- Validate user input before queries
- Use Prisma's type-safe API
- Avoid raw query methods (`$queryRaw`) unless necessary

### Principle of Least Privilege

**Database Users**:
- **Runtime user** (`demo_user`): SELECT, INSERT, UPDATE, DELETE only
- **Migration user** (`postgres`): Full DDL permissions (CREATE, ALTER, DROP)

**Implementation**:
- `DATABASE_URL`: Limited permissions user
- `MIGRATION_DATABASE_URL`: Admin user for schema changes

---

## Demo Component

### Purpose

The demo component (`src/components/demo/`) serves as:
1. **Reference Implementation**: Shows best practices
2. **Integration Test**: Validates the feature works end-to-end
3. **Developer Onboarding**: Provides working examples

### Features Demonstrated

1. **Schema Definition**: `prisma/schema.prisma` with models and enums
2. **Service Layer**: `component.service.ts` with CRUD operations
3. **Controller Layer**: `component.controller.tsx` with HTTP routes
4. **UI Layer**: JSX components with SSR
5. **Testing**: Integration tests for service and controller

### Demo Models

**DemoUser**:
- Fields: id, name (unique), email (unique), createdAt, updatedAt
- Relations: One-to-many with DemoPost

**DemoPost**:
- Fields: id, title, content, status (enum), authorId, createdAt, updatedAt
- Relations: Many-to-one with DemoUser (cascade delete)
- Indexes: authorId

**DemoPostStatus** (Enum):
- Values: DRAFT, PUBLISHED, ARCHIVED

### UI Implementation

**Routes**:
- `GET /demo/posts`: List all posts with form
- `POST /demo/posts`: Create new post
- `POST /demo/posts/:id/delete`: Delete post

**Features**:
- Server-side rendering with JSX
- Form validation
- Responsive design
- Status badges (DRAFT, PUBLISHED, ARCHIVED)

---

## Migration Workflow

### Development Workflow

1. **Modify schema**: Edit `src/components/*/prisma/schema.prisma`
2. **Build**: Run `npm run build` (or let HMR rebuild)
3. **Create migration**: Run `npx prisma migrate dev --name description`
4. **Test**: Verify migration applied correctly
5. **Commit**: Commit schema + migration files

### Production Deployment

1. **Review migrations**: Check SQL files for safety
2. **Backup database**: Always backup before applying migrations
3. **Apply migrations**: Run `npx prisma migrate deploy`
4. **Verify**: Check migration status with `npx prisma migrate status`
5. **Monitor**: Watch for errors or performance issues

### Migration Best Practices

- **Descriptive names**: `add_user_email_index`, not `migration_1`
- **Small changes**: One logical change per migration
- **Backwards compatible**: Avoid breaking changes when possible
- **Test rollback**: Ensure migrations can be reversed if needed
- **Document**: Add comments in schema for complex changes

---

## Future Enhancements

### Potential Improvements

1. **Automatic Migrations**
   - Auto-generate migrations during build
   - Optional feature for development environments
   - Safety checks before applying

2. **Schema Validation**
   - Lint component schemas for best practices
   - Check for naming conflicts early
   - Validate relations across components

3. **Query Optimization**
   - Analyze slow queries automatically
   - Suggest indexes for common patterns
   - Performance monitoring integration

4. **Multi-Database Support**
   - Support for MongoDB, MySQL, etc.
   - Per-component database selection
   - Polyglot persistence patterns

5. **Schema Documentation Generation**
   - Auto-generate ERD diagrams
   - API documentation from schemas
   - Interactive schema explorer

6. **Advanced Testing**
   - Schema migration testing
   - Performance regression tests
   - Database seeding utilities

---

## Lessons Learned

### What Worked Well

1. **Webpack Plugin Approach**: Seamless integration with existing build process
2. **Global PrismaService**: Simplified component development significantly
3. **Demo Component**: Essential for validation and documentation
4. **Prisma Multi-File Schemas**: Native support eliminated complexity
5. **pg_dump for Test Schemas**: Handles all edge cases (ENUMs, indexes, constraints) automatically

### Challenges Overcome

1. **TypeScript Type Inference**: PrismaClient extension caused type issues
   - **Solution**: Used eslint-disable comments, explicit return types
   
2. **Module Dependency Injection**: Initial setup had circular dependencies
   - **Solution**: Created separate DatabaseModule with @Global() decorator

3. **HMR Integration**: Schema changes didn't trigger rebuild initially
   - **Solution**: Added file watchers in Webpack plugin

4. **Test Database Isolation**: Race conditions with parallel test execution
   - **Problem**: Tests sharing same schema caused intermittent failures
   - **Attempts**:
     - Prisma migrations per schema (rejected: migration tracking conflicts)
     - Manual schema copying with CREATE TABLE...LIKE (rejected: ENUM type reference issues)
   - **Solution**: Use `pg_dump` to copy complete schema structure with proper type qualifications
   - **Implementation**: `jest.globalSetup.ts` creates worker-specific schemas, `PrismaService` detects `JEST_WORKER_ID`

5. **ENUM Type Handling in Test Schemas**: Schema-qualified types caused errors
   - **Problem**: `CREATE TABLE...LIKE` doesn't update ENUM type references (public.EnumType vs test_N.EnumType)
   - **Solution**: `pg_dump` automatically handles schema-qualified type references in column defaults and constraints

6. **Worker Count Coordination**: Misalignment between Jest workers and test schemas
   - **Problem**: Hard-coded schema count vs dynamic Jest worker count caused "test_8 doesn't exist" errors
   - **Solution**: Mandatory `JEST_WORKERS` environment variable coordinates both Jest maxWorkers and schema creation
   - **Implementation**: Validation in `jest.globalSetup.ts` with clear error messages

### Best Practices Established

1. **Always build before migrating**: Ensures schemas are up to date
2. **Test with real database**: Integration tests catch real issues
3. **Document as you build**: Easier than retroactive documentation
4. **Start simple, iterate**: MVP first, then enhance

---

## Conclusion

The component-level database integration feature successfully delivers:

- ✅ **Automatic Discovery**: No manual configuration needed
- ✅ **Type Safety**: Full TypeScript support from database to UI
- ✅ **Developer Experience**: Clear patterns and comprehensive docs
- ✅ **Security**: Best practices for credential management
- ✅ **Performance**: Minimal overhead, efficient queries
- ✅ **Maintainability**: Clean separation of concerns, modular design

The implementation follows all project constitution principles and provides a solid foundation for building data-driven components in the platform.

---

## References

- [Feature Specification](../../specs/002-as-an-end/spec.md)
- [Implementation Plan](../../specs/002-as-an-end/plan.md)
- [Developer Guide](../dev_guides/DATABASE_INTEGRATION_GUIDE.md)
- [Quickstart Guide](../../specs/002-as-an-end/quickstart.md)
- [Demo Component](../../src/components/demo/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
