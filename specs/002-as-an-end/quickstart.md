# Quickstart: Component-Level Database Integration

**Feature**: `002-as-an-end` | **Date**: 2025-10-21

## Overview

This guide shows you how to add database functionality to your component using Prisma. You'll learn how to:

1. Define a database schema for your component
2. Use the centralized Prisma Client to access the database
3. Run migrations to update the database structure
4. Test your database code

## Prerequisites

- PostgreSQL database running (see Development Environment Setup below)
- Node.js 18+ and npm installed
- Basic understanding of Prisma and database concepts

## Development Environment Setup

### 1. Start the PostgreSQL Database

The project includes a Docker Compose configuration for local development:

```bash
# Start the database (run this in a separate terminal or as background task)
docker compose up

# Or use the VS Code task: "Docker: Compose Up"
```

### 2. Configure Database Connection

Create a `.env` file in the project root if it doesn't exist:

```env
# Database connection for runtime
DATABASE_URL="postgresql://demo_user:demo_password@localhost:5432/monobackend?schema=public"

# Database connection for migrations (optional - uses DATABASE_URL if not set)
MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/monobackend?schema=public"
```

**Note**: The `.env` file is gitignored. Never commit database credentials to version control.

## Adding Database to Your Component

### Step 1: Create Component Schema File

Create a Prisma schema file in your component directory at `src/components/your-component/prisma/schema.prisma`:

```prisma
// src/components/your-component/prisma/schema.prisma

// IMPORTANT: Include ONLY model and enum definitions
// NO datasource or generator blocks

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String
  author    User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Step 2: Build the Project

The build process will discover your schema and generate the Prisma Client:

```bash
npm run build
```

This will:
1. Discover your `prisma/schema.prisma` file
2. Copy it to `prisma/schema/your-component.prisma`
3. Generate `prisma/schema/main.prisma` with datasource and generator configuration
4. Run `prisma generate` to create the centralized Prisma Client

### Step 3: Create and Apply Migration

Create a migration for your new schema:

```bash
npx prisma migrate dev --name add_your_component_models
```

This will:
1. Generate a SQL migration file in `prisma/migrations/`
2. Apply the migration to your development database
3. Regenerate the Prisma Client

**Important**: You must run migrations manually before starting the dev server.

### Step 4: Use Prisma Client in Your Component

Import and use the Prisma Client in your component code:

```typescript
// src/components/your-component/component.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/runtime/prisma.service';

@Injectable()
export class YourComponentService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(data: { email: string; name: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async getUserWithPosts(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { posts: true },
    });
  }
}
```

### Step 5: Register Service in Your Module

Make sure to provide your service in your component's NestJS module:

```typescript
// src/components/your-component/component.module.ts
import { Module } from '@nestjs/common';
import { YourComponentController } from './component.controller';
import { YourComponentService } from './component.service';

@Module({
  controllers: [YourComponentController],
  providers: [YourComponentService],
})
export class YourComponentModule {}
```

**Note**: You don't need to import `PrismaService` in your module - it's registered as a global provider.

### Step 6: Use Service in Controller

Use your service in your controller to handle HTTP requests:

```typescript
// src/components/your-component/component.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { YourComponentService } from './component.service';

@Controller('your-component')
export class YourComponentController {
  constructor(private service: YourComponentService) {}

  @Get('users')
  async listUsers() {
    return this.service.getAllUsers();
  }

  @Post('users')
  async createUser(@Body() data: { email: string; name: string }) {
    return this.service.createUser(data);
  }
}
```

## Development Workflow

### Making Schema Changes

1. **Modify your schema file**: Edit `src/components/your-component/prisma/schema.prisma`

2. **Rebuild the project**:
   ```bash
   npm run build
   ```
   Or if using HMR, Webpack will automatically detect the change and rebuild.

3. **Create and apply migration**:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

4. **Restart dev server** (if not using HMR, or if HMR doesn't pick up the change):
   ```bash
   npm run start:dev
   ```

### Typical Development Session

```bash
# Terminal 1: Start database
docker compose up

# Terminal 2: Start dev server with HMR
npm run start:dev

# Terminal 3: When you make schema changes
npm run build  # If not using HMR, or to force rebuild
npx prisma migrate dev --name your_change_description

# The dev server will auto-reload with HMR
```

## Testing Your Database Code

### Unit Tests (Mocking Prisma)

```typescript
// src/components/your-component/component.service.spec.ts
import { Test } from '@nestjs/testing';
import { YourComponentService } from './component.service';
import { PrismaService } from '../../database/runtime/prisma.service';

describe('YourComponentService', () => {
  let service: YourComponentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        YourComponentService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(YourComponentService);
    prisma = module.get(PrismaService);
  });

  it('should get all users', async () => {
    const mockUsers = [{ id: '1', email: 'test@example.com', name: 'Test' }];
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);

    const result = await service.getAllUsers();
    expect(result).toEqual(mockUsers);
  });
});
```

### Integration Tests (Real Database)

```typescript
// src/components/your-component/test/integration/component.integration.spec.ts
import { Test } from '@nestjs/testing';
import { YourComponentService } from '../../component.service';
import { PrismaService } from '../../../../database/runtime/prisma.service';

describe('YourComponentService (Integration)', () => {
  let service: YourComponentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [YourComponentService, PrismaService],
    }).compile();

    service = module.get(YourComponentService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve a user', async () => {
    const userData = { email: 'integration@example.com', name: 'Integration Test' };
    
    const created = await service.createUser(userData);
    expect(created.email).toBe(userData.email);

    const users = await service.getAllUsers();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(userData.email);
  });
});
```

## Common Patterns

### Transactions

Use Prisma's interactive transactions for operations that must succeed or fail together:

```typescript
async transferPost(postId: string, newAuthorId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Verify new author exists
    const newAuthor = await tx.user.findUnique({
      where: { id: newAuthorId },
    });
    if (!newAuthor) {
      throw new Error('New author not found');
    }

    // Update post
    return tx.post.update({
      where: { id: postId },
      data: { authorId: newAuthorId },
    });
  });
}
```

### Pagination

Implement cursor-based pagination for large datasets:

```typescript
async getPaginatedPosts(cursor?: string, limit = 10) {
  return this.prisma.post.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
```

### Filtering and Sorting

Build dynamic queries with Prisma's query builder:

```typescript
async searchPosts(filters: {
  authorId?: string;
  status?: string;
  searchTerm?: string;
}) {
  return this.prisma.post.findMany({
    where: {
      ...(filters.authorId && { authorId: filters.authorId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.searchTerm && {
        OR: [
          { title: { contains: filters.searchTerm, mode: 'insensitive' } },
          { content: { contains: filters.searchTerm, mode: 'insensitive' } },
        ],
      }),
    },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
}
```

## Troubleshooting

### Error: "Prisma schema not found"

**Problem**: Build process doesn't find your schema file.

**Solution**: 
- Ensure schema is at `src/components/your-component/prisma/schema.prisma`
- Rebuild the project: `npm run build`

### Error: "Model name already exists"

**Problem**: Another component uses the same model name.

**Solution**:
- Rename your models to avoid conflicts
- Coordinate with other component developers to choose unique names

### Error: "DATABASE_URL environment variable not found"

**Problem**: Missing or incorrect `.env` file.

**Solution**:
- Create `.env` file in project root
- Add `DATABASE_URL` with valid PostgreSQL connection string
- Restart your dev server

### Error: Migration conflicts

**Problem**: Multiple developers created migrations simultaneously.

**Solution**:
```bash
# Pull latest changes
git pull

# Reset migration history (development only!)
npx prisma migrate reset

# Recreate migrations
npx prisma migrate dev
```

### Database connection issues

**Problem**: Can't connect to database.

**Solution**:
1. Ensure PostgreSQL is running: `docker compose up`
2. Check `.env` file has correct credentials
3. Test connection: `npx prisma db push` (will show connection errors)

## Best Practices

1. **Schema Location**: Keep schemas in `src/components/your-component/prisma/schema.prisma`
2. **No Datasource/Generator**: Component schemas should only contain models and enums
3. **Manual Migrations**: Always create migrations explicitly with `prisma migrate dev`
4. **Test Data Cleanup**: Clean up test data in `beforeEach` hooks
5. **Use Transactions**: For operations that must be atomic
6. **Type Safety**: Let TypeScript and Prisma's generated types catch errors
7. **Error Handling**: Handle Prisma errors (unique constraint violations, not found, etc.)
8. **Model Name Conflicts**: Be aware that model names must be unique across all components

## Example: Complete Component with Database

See the demo component for a complete working example:
- Schema: `src/components/demo/prisma/schema.prisma`
- Service: `src/components/demo/component.service.ts`
- Controller: `src/components/demo/component.controller.tsx`
- UI: `src/components/demo/ui/` (DemoPage.tsx, PostCard.tsx, AddPostForm.tsx)
- Styles: `src/components/demo/ui/demo.css`
- Tests: `src/components/demo/test/`

The demo shows a simple post list with add/delete functionality, demonstrating:
- Prisma Client usage in services
- Server-side JSX rendering
- Form handling and redirects
- CSS asset management
- Integration testing with database

## Next Steps

- Read the [Prisma documentation](https://www.prisma.io/docs) for advanced features
- Explore Prisma's [relation queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries)
- Learn about [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- Review [Prisma best practices](https://www.prisma.io/docs/orm/prisma-client/best-practices)
- Check the [UI Assets Management Guide](../../docs/dev_guides/UI_ASSETS_MANAGEMENT_GUIDE.md) for CSS/asset handling

## Getting Help

- Check the demo component for working examples
- Review the [feature specification](./spec.md) for detailed requirements
- See the [data model documentation](./data-model.md) for entity relationships
- Check the [UI specification](./contracts/demo-ui.md) for the demo component interface
