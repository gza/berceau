# Database Integration Guide

**Last Updated**: October 22, 2025

## Overview

This guide explains how to add database functionality to your components using Prisma ORM. The architecture provides automatic schema discovery, centralized Prisma Client generation, and type-safe database access throughout your components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Schema Definition](#schema-definition)
4. [Migration Workflow](#migration-workflow)
5. [Using the Database in Your Code](#using-the-database-in-your-code)
6. [Testing with the Database](#testing-with-the-database)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### How It Works

1. **Component-Level Schemas**: Each component defines its database models in `src/components/{component}/prisma/schema.prisma`
2. **Build-Time Discovery**: Webpack plugin discovers all component schemas during build
3. **Centralized Schema Generation**: All schemas are copied to `prisma/schema/` directory
4. **Single Prisma Client**: One Prisma Client is generated with models from all components
5. **Global Service**: `PrismaService` is available as a global provider throughout the application

### Directory Structure

```
src/
├── components/
│   └── your-component/
│       ├── prisma/
│       │   └── schema.prisma          # Component schema (models only)
│       ├── component.service.ts       # Uses PrismaService
│       └── component.module.ts
├── database/
│   └── runtime/
│       ├── database.module.ts         # Global module
│       └── prisma.service.ts          # Injectable service
└── ...

prisma/
├── schema/
│   ├── main.prisma                    # Generated datasource/generator
│   └── your-component.prisma          # Copied from component
└── migrations/                        # Migration history
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Docker (for local development)
- Basic understanding of Prisma ORM

### 1. Start the Database

Use Docker Compose to start a local PostgreSQL instance:

```bash
docker compose up
```

Or use the VS Code task: **"Docker: Compose Up"**

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Runtime connection (used by the application)
DATABASE_URL="postgresql://demo_user:demo_password@localhost:5432/berceau-dev?schema=public"

# Migration connection (used by Prisma CLI)
# Optional - falls back to DATABASE_URL if not specified
MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/berceau-dev?schema=public"
```

**Security Note**: The `.env` file is gitignored. Never commit database credentials.

### 3. Initial Build

Build the project to generate the Prisma Client:

```bash
npm run build
```

This runs the schema discovery plugin and generates the centralized Prisma Client.

---

## Schema Definition

### Component Schema File

Create your schema at `src/components/{your-component}/prisma/schema.prisma`:

```prisma
// IMPORTANT: Include ONLY model and enum definitions
// NO datasource or generator blocks

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts     Post[]
}

model Post {
  id        String         @id @default(uuid())
  title     String
  content   String?
  status    PostStatus     @default(DRAFT)
  authorId  String
  author    User           @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([authorId])
  @@index([status])
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Schema Rules

1. **Models Only**: Only include `model` and `enum` definitions
2. **No Config Blocks**: Do NOT include `datasource` or `generator` blocks (these are auto-generated)
3. **Unique Names**: Model names must be unique across all components
4. **Valid Syntax**: Must follow Prisma schema syntax
5. **Relations**: Can reference models from the same or other components

### Naming Conventions

- **Models**: PascalCase (e.g., `DemoUser`, `BlogPost`)
- **Fields**: camelCase (e.g., `createdAt`, `authorId`)
- **Enums**: PascalCase (e.g., `PostStatus`)
- **Enum Values**: UPPER_SNAKE_CASE (e.g., `DRAFT`, `PUBLISHED`)

---

## Migration Workflow

### Creating Migrations

After defining or modifying your schema:

1. **Build the project** (to discover schema changes):
   ```bash
   npm run build
   ```

2. **Create a migration**:
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```
   
   Examples:
   - `npx prisma migrate dev --name add_user_model`
   - `npx prisma migrate dev --name add_email_unique_index`
   - `npx prisma migrate dev --name change_status_enum`

3. **Verify migration was created**:
   ```bash
   ls -la prisma/migrations/
   ```

### What Happens During Migration

1. Prisma analyzes the schema differences
2. Generates SQL migration file in `prisma/migrations/{timestamp}_{name}/`
3. Applies the migration to your development database
4. Regenerates the Prisma Client with updated types

### Migration Commands

```bash
# Create and apply migration (dev)
npx prisma migrate dev --name <description>

# Check migration status
npx prisma migrate status

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration history
npx prisma migrate status
```

### Development Workflow

```bash
# Terminal 1: Database
docker compose up

# Terminal 2: Dev server (with HMR)
npm run start:dev

# Terminal 3: When you modify schemas
npm run build
npx prisma migrate dev --name your_change
# Server auto-reloads with HMR
```

---

## Using the Database in Your Code

### Service Layer

Create a service to encapsulate database operations:

```typescript
// src/components/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/runtime/prisma.service';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPosts() {
    return this.prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return post;
  }

  async createPost(data: {
    title: string;
    content: string;
    authorId: string;
  }) {
    return this.prisma.post.create({
      data,
      include: { author: true },
    });
  }

  async updatePost(id: string, data: { title?: string; content?: string }) {
    return this.prisma.post.update({
      where: { id },
      data,
      include: { author: true },
    });
  }

  async deletePost(id: string) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
```

### Controller Layer

Use the service in your controller:

```typescript
// src/components/blog/blog.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('posts')
  async listPosts() {
    return this.blogService.getAllPosts();
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    return this.blogService.getPostById(id);
  }

  @Post('posts')
  async createPost(@Body() data: { title: string; content: string; authorId: string }) {
    return this.blogService.createPost(data);
  }

  @Put('posts/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() data: { title?: string; content?: string }
  ) {
    return this.blogService.updatePost(id, data);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }
}
```

### Module Registration

Register your service in your component module:

```typescript
// src/components/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService], // Export if other modules need it
})
export class BlogModule {}
```

**Note**: You don't need to import `DatabaseModule` or `PrismaService` - they're globally available.

### Advanced Queries

#### Filtering and Sorting

```typescript
async getPublishedPosts() {
  return this.prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}
```

#### Pagination

```typescript
async getPosts(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    this.prisma.post.findMany({
      skip,
      take: limit,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.post.count(),
  ]);

  return {
    posts,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
```

#### Transactions

```typescript
async createPostWithAuthor(data: {
  authorName: string;
  authorEmail: string;
  title: string;
  content: string;
}) {
  return this.prisma.$transaction(async (prisma) => {
    // Create or find author
    const author = await prisma.user.upsert({
      where: { email: data.authorEmail },
      update: {},
      create: {
        name: data.authorName,
        email: data.authorEmail,
      },
    });

    // Create post
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: author.id,
      },
      include: { author: true },
    });
  });
}
```

---

## Testing with the Database

### Test Isolation Strategy

**Schema-Based Isolation**:
- Each Jest worker gets its own isolated schema (`test_1`, `test_2`, etc.)
- `jest.globalSetup.ts` creates test schemas before all tests run
- `PrismaService` auto-detects `JEST_WORKER_ID` and uses the appropriate schema
- Tests can run in parallel without conflicts or race conditions

**Environment Variable Configuration**:
- `JEST_WORKERS` environment variable is **required** and controls both Jest worker count and test schema count
- Set in package.json test scripts: `"JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS"`
- Ensures the number of test schemas matches the actual Jest worker count
- Validation error if `JEST_WORKERS` is not set or invalid

**Schema Creation Process**:
- Uses `pg_dump` to copy complete schema structure from `public` schema
- Handles ENUMs, indexes, constraints, and sequences automatically
- Grants proper permissions to application user on each test schema
- More reliable than manual schema copying or Prisma migrations

**Per-Test Cleanup**:
- `beforeEach`: Use `deleteMany()` to clean tables in your worker's schema
- `afterAll`: Disconnect from database
- No need to drop/recreate schemas (handled by globalSetup)

**Running Tests**:
```bash
# Parallel execution (default, uses schema isolation)
npm run test

# Serial execution (if needed for debugging)
npm run test -- --maxWorkers=1

# Custom worker count (update JEST_WORKERS in package.json accordingly)
JEST_WORKERS=4 jest --maxWorkers=4
```

---

### Integration Tests

Test with real database operations using the isolated test schema:

```typescript
// src/components/blog/test/blog.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from '../blog.service';
import { PrismaService } from '../../../database/runtime/prisma.service';

describe('BlogService - Integration', () => {
  let service: BlogService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogService, PrismaService],
    }).compile();

    service = module.get<BlogService>(BlogService);
    prisma = module.get<PrismaService>(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate for each test (within this worker's schema)
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should create a post', async () => {
    const user = await prisma.user.create({
      data: { name: 'John', email: 'john@example.com' },
    });

    const post = await service.createPost({
      title: 'Test Post',
      content: 'Test content',
      authorId: user.id,
    });

    expect(post).toBeDefined();
    expect(post.title).toBe('Test Post');
    expect(post.author.email).toBe('john@example.com');
  });
});
```

**Important Notes**:
- Each test worker has its own isolated schema
- `PrismaService` automatically connects to the correct schema based on `JEST_WORKER_ID`
- No need to manually configure schema isolation in your tests
- Use `deleteMany()` in `beforeEach` to ensure clean state between tests

### Unit Tests (Mocking)

For faster unit tests, mock the Prisma Service:

```typescript
describe('BlogService - Unit', () => {
  let service: BlogService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: PrismaService,
          useValue: {
            post: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    prisma = module.get(PrismaService);
  });

  it('should get all posts', async () => {
    const mockPosts = [{ id: '1', title: 'Test' }];
    prisma.post.findMany.mockResolvedValue(mockPosts);

    const result = await service.getAllPosts();

    expect(result).toEqual(mockPosts);
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});
```

---

## Best Practices

### 1. Schema Organization

- **One schema per component**: Keep schemas co-located with component code
- **Meaningful names**: Use descriptive model and field names
- **Consistent conventions**: Follow the naming conventions (PascalCase models, camelCase fields)

### 2. Service Layer Patterns

- **Encapsulate database logic**: All Prisma operations go in services
- **Handle errors**: Use try-catch and throw appropriate NestJS exceptions
- **Return consistent types**: Define return types for service methods
- **Validate inputs**: Validate data before passing to Prisma

### 3. Migrations

- **Descriptive names**: Use clear migration names (`add_user_email_index`)
- **Test migrations**: Always test migrations before deploying
- **Backup production**: Always backup before running migrations in production
- **Review SQL**: Check generated SQL files before committing

### 4. Performance

- **Use indexes**: Add indexes for frequently queried fields
- **Selective includes**: Only include relations you need
- **Pagination**: Always paginate large result sets
- **Connection pooling**: Prisma handles this automatically

### 5. Security

- **Never expose PrismaService**: Only expose it to your service layer
- **Validate inputs**: Always validate user input before queries
- **Use parameterized queries**: Prisma handles this automatically
- **Environment variables**: Never hardcode credentials

---

## Troubleshooting

### Build Issues

**Problem**: Schema not discovered during build

**Solution**:
```bash
# Verify schema file exists
ls src/components/your-component/prisma/schema.prisma

# Force rebuild
rm -rf dist node_modules/.prisma
npm run build
```

### Migration Issues

**Problem**: Migration fails with "already exists" error

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# If needed, reset (WARNING: deletes data)
npx prisma migrate reset
```

**Problem**: Prisma Client types out of sync

**Solution**:
```bash
# Regenerate client
npx prisma generate
npm run build
```

### Runtime Issues

**Problem**: `PrismaService` not found / dependency injection fails

**Solution**: Verify `DatabaseModule` is imported in `AppModule`:
```typescript
@Module({
  imports: [DatabaseModule, /* ... */],
})
export class AppModule {}
```

**Problem**: Models not available on PrismaService

**Solution**:
```bash
# Rebuild to discover schemas and regenerate client
npm run build
npx prisma generate
```

### Type Safety Issues

**Problem**: TypeScript shows `any` types for Prisma operations

**Solution**: This is a known issue when extending `PrismaClient`. The types work correctly at runtime. You can:
1. Add explicit return types to your methods
2. Use `eslint-disable` comments for Prisma operations
3. Cast to proper types when needed

### Test Issues

**Problem**: "JEST_WORKERS environment variable is required"

**Cause**: The `JEST_WORKERS` environment variable is not set in test scripts

**Solution**: Update your package.json test scripts to include `JEST_WORKERS`:
```json
{
  "scripts": {
    "test": "JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS",
    "test:watch": "JEST_WORKERS=8 jest --watch --maxWorkers=$JEST_WORKERS",
    "test:cov": "JEST_WORKERS=8 jest --coverage --maxWorkers=$JEST_WORKERS"
  }
}
```

The number should match your desired parallel worker count (typically 50-75% of CPU cores).

**Problem**: Tests fail intermittently with "relation does not exist"

**Cause**: Test schema not properly initialized or race conditions

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

**Problem**: "Permission denied for schema test_N"

**Cause**: Application user doesn't have permissions on test schemas

**Solution**: Verify `jest.globalSetup.ts` includes permission grants and uses the correct application user extracted from `DATABASE_URL`.

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [NestJS Prisma Integration](https://docs.nestjs.com/recipes/prisma)
- [Demo Component](../../src/components/demo/) - Reference implementation

---

## Getting Help

If you encounter issues:

1. Check this guide and the troubleshooting section
2. Review the [demo component](../../src/components/demo/) implementation
3. Check the [quickstart guide](../../specs/002-as-an-end/quickstart.md)
4. Review the [implementation documentation](../implementation_doc/DATABASE_INTEGRATION_IMPLEMENTATION.md)
