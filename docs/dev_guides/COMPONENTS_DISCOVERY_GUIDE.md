# Components Discovery Guide - Adding Drop-in Components

**Audience:** Developers adding new features to the application

**Related docs:**
- [Implementation Details](../implementation_doc/COMPONENTS_DISCOVERY_IMPLEMENTATION.md) - How the discovery system works internally
- [UI Assets Management Guide](../dev_guides/UI_ASSETS_MANAGEMENT_GUIDE.md) - How to use images, SVG, and CSS in features
- [Hot Reload Implementation](../implementation_doc/HOT_RELOAD_IMPLEMENTATION.md) - How HMR works with component discovery

## Overview

The component discovery system allows you to add complete, self-contained features by simply creating a folder under `src/components/`. No need to edit files outside your feature folder—the build system automatically discovers, validates, and registers your feature.

### What You Get

✅ **Automatic route registration** - NestJS controllers discovered and wired into the app  
✅ **Automatic navigation** - Menu entries added based on metadata  
✅ **Hot Module Replacement** - Changes reload instantly during development  
✅ **Build-time validation** - Errors caught before deployment  
✅ **Type safety** - Full TypeScript support throughout  
✅ **Co-located assets** - Keep UI, styles, and tests together

## Quick Start

### 1. Create Feature Folder

```bash
mkdir -p src/components/my-feature/ui
```

### 2. Add Feature Metadata

Create `src/components/my-feature/component.meta.ts`:

```typescript
import type { ComponentMeta } from '../types';

export const componentMeta: ComponentMeta = {
  id: 'my-feature',
  title: 'My Feature',
  description: 'A great new feature',
  routes: [
    { path: '/my-feature', title: 'My Feature Page', isPrimary: true },
  ],
  nav: { label: 'My Feature', order: 100 },
} as const;
```

**Key fields:**
- `id` - Unique identifier (required, must be unique across all features)
- `title` - Display title (required)
- `description` - Optional description
- `routes` - Array of route definitions (required, at least one)
- `nav` - Optional navigation menu entry

**Route fields:**
- `path` - URL path like `/my-feature` (required, must be unique)
- `title` - Page title (required)
- `isPrimary` - Mark as primary route for navigation (optional, only one per feature)

**Navigation rules:**
- If you include `nav`, you **must** have exactly one route with `isPrimary: true`
- Without `nav`, your feature won't appear in the left menu (routes still work)
- `order` controls menu position (lower numbers appear first)

### 3. Create NestJS Module

Create `src/components/my-feature/component.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MyFeatureController } from './component.controller';

@Module({
  controllers: [MyFeatureController],
})
export class MyFeatureModule {}
```

### 4. Create Controller

Create `src/components/my-feature/component.controller.ts`:

```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { renderPage } from '../../ssr/renderPage';
import { MyFeaturePage } from './ui/MyFeaturePage';
import { componentMeta } from './component.meta';

@Controller()
export class MyFeatureController {
  @Get(componentMeta.routes[0].path)
  async myFeature(@Res() res: Response) {
    const html = await renderPage({
      page: MyFeaturePage,
      props: { title: componentMeta.title },
    });
    res.status(200).send(html);
  }
}
```

**Best practices:**
- Use `@Controller()` without a path prefix (paths come from metadata)
- Reference paths from `componentMeta.routes` to keep things DRY
- Use `renderPage()` from `../../ssr/renderPage` for SSR

### 5. Create UI Component

Create `src/components/my-feature/ui/MyFeaturePage.tsx`:

```typescript
export function MyFeaturePage(props: { title: string }) {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>Welcome to my feature!</p>
    </div>
  );
}
```

### 6. Run Development Server

```bash
npm run start:dev
```

Visit `http://localhost:3000/my-feature` - your feature is live! Check the left navigation menu for your new entry.

## File Structure

Complete feature structure with all optional elements:

```
src/components/my-feature/
├── component.meta.ts           # Metadata (required)
├── component.module.ts          # NestJS module (required)
├── component.controller.ts      # NestJS controller (required)
├── ui/                        # UI components
│   ├── MyFeaturePage.tsx      # Main page component
│   ├── MyFeaturePage.spec.tsx # Component tests
│   ├── my-feature.css         # Styles
│   └── icon.svg               # Assets (images, icons)
└── test/                      # Integration tests
    └── integration/
        └── my-feature.integration.spec.ts
```

## Working with Assets

Import images, SVG, and CSS directly in your components:

```typescript
import styles from './my-feature.css';
import logo from './logo.svg';
import banner from './banner.png';

export function MyFeaturePage() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      <img src={logo} alt="Logo" />
      <div style={{ backgroundImage: `url(${banner})` }}>
        <h1>My Feature</h1>
      </div>
    </div>
  );
}
```

Assets are automatically copied to `dist/assets/components/my-feature/ui/` and served at `/assets/components/my-feature/ui/`.

**See [UI Assets Management Guide](../dev_guides/UI_ASSETS_MANAGEMENT_GUIDE.md) for more details.**

## Multiple Routes

Features can have multiple routes. Mark one as primary if you want navigation:

```typescript
export const componentMeta: ComponentMeta = {
  id: 'my-feature',
  title: 'My Feature',
  routes: [
    { path: '/my-feature', title: 'Overview', isPrimary: true },
    { path: '/my-feature/details', title: 'Details' },
    { path: '/my-feature/settings', title: 'Settings' },
  ],
  nav: { label: 'My Feature', order: 100 },
} as const;
```

Then add corresponding `@Get()` handlers in your controller:

```typescript
@Controller()
export class MyFeatureController {
  @Get('/my-feature')
  async overview(@Res() res: Response) {
    // Render overview page
  }

  @Get('/my-feature/details')
  async details(@Res() res: Response) {
    // Render details page
  }

  @Get('/my-feature/settings')
  async settings(@Res() res: Response) {
    // Render settings page
  }
}
```

## Testing Your Feature

### Component Tests

Create tests alongside your components in `ui/`:

```typescript
// src/components/my-feature/ui/MyFeaturePage.spec.tsx
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MyFeaturePage } from './MyFeaturePage';

describe('MyFeaturePage', () => {
  it('renders title', () => {
    const { getByText } = render(<MyFeaturePage title="Test Title" />);
    expect(getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Integration Tests

Create integration tests in `test/integration/`:

```typescript
// src/components/my-feature/test/integration/my-feature.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MyFeatureModule } from '../../component.module';

describe('MyFeature Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [MyFeatureModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('GET /my-feature returns 200', () => {
    return request(app.getHttpServer())
      .get('/my-feature')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

Run tests:

```bash
npm test                           # All tests
npm test my-feature                # Tests matching "my-feature"
npm test -- --watch                # Watch mode
```

## Validation and Error Messages

The build system validates your feature metadata and will show clear error messages if something is wrong:

### Common Errors

**Duplicate route path:**
```
ERROR in Feature 'my-feature' has duplicate route path '/demo' (also used by 'demo')
```
**Fix:** Change your route path to be unique across all features.

**Missing required field:**
```
ERROR in Feature metadata validation failed in src/components/my-feature/component.meta.ts:
- Missing required field 'id'
```
**Fix:** Add the missing field to your `componentMeta` object.

**Navigation without primary route:**
```
ERROR in Feature 'my-feature' has 'nav' but no primary route. Mark exactly one route with isPrimary: true, or remove 'nav'.
```
**Fix:** Add `isPrimary: true` to exactly one route, or remove the `nav` field.

**Multiple primary routes:**
```
ERROR in Feature 'my-feature' has multiple routes marked as isPrimary (found 2). Only one route can be primary.
```
**Fix:** Keep `isPrimary: true` on only one route.

**Validation errors block development:**
- HMR will not update until errors are fixed
- Check your terminal for error messages
- Fix the metadata and save - HMR will resume automatically

## Best Practices

### ✅ Do

- Keep feature IDs lowercase with hyphens (e.g., `my-feature`, `user-dashboard`)
- Use meaningful route paths that match your feature ID
- Co-locate all feature files in one folder
- Write tests for your components and routes
- Use TypeScript strict mode
- Reference metadata constants (DRY principle)
- Keep navigation order numbers spaced (10, 20, 30...) to allow insertions

### ❌ Don't

- Don't edit files outside your feature folder
- Don't use duplicate route paths
- Don't add `nav` without marking a primary route
- Don't hard-code values that exist in metadata
- Don't skip validation errors
- Don't use spaces or special characters in feature IDs

## Development Workflow

### Adding a Feature

1. Create folder structure
2. Add metadata (`component.meta.ts`)
3. Add module (`component.module.ts`)
4. Add controller (`component.controller.ts`)
5. Add UI component (`ui/MyFeaturePage.tsx`)
6. **Watch terminal for validation errors**
7. Fix any errors
8. Visit your route in the browser
9. Add tests

### Iterating on a Feature

1. Make changes to any file in your feature folder
2. Save file
3. **HMR rebuilds automatically** (~500ms)
4. **If validation errors appear, fix them**
5. Browser updates automatically (if no errors)
6. Run tests: `npm test my-feature`

### Removing a Feature

1. Delete the feature folder
2. HMR rebuilds automatically
3. Routes and navigation are removed
4. No cleanup needed

## Troubleshooting

### Feature not appearing in navigation

**Check:**
- Do you have a `nav` field in your metadata?
- Does exactly one route have `isPrimary: true`?
- Is the dev server running?
- Check terminal for validation errors

### Route returns 404

**Check:**
- Is the path in metadata the same as in your `@Get()` decorator?
- Is the feature folder named correctly?
- Check terminal for validation errors
- Restart dev server if needed

### HMR not updating

**Check:**
- Are there validation errors in the terminal?
- Did you save the file?
- Is `npm run start:dev` running?
- Try restarting the dev server

### Changes not reflected after fixing errors

**Solution:**
- Save the file again after fixing errors
- HMR should resume automatically
- If not, restart the dev server

## Advanced Topics

### Conditional Navigation

If you want a route but no navigation entry, simply omit the `nav` field:

```typescript
export const componentMeta: ComponentMeta = {
  id: 'hidden-feature',
  title: 'Hidden Feature',
  routes: [
    { path: '/hidden', title: 'Hidden Page' },
  ],
  // No nav field = no menu entry
} as const;
```

### Services and Dependencies

Your feature module can import other modules and use dependency injection normally:

```typescript
import { Module } from '@nestjs/common';
import { MyFeatureController } from './component.controller';
import { MyFeatureService } from './feature.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MyFeatureController],
  providers: [MyFeatureService],
  exports: [MyFeatureService], // Export if other features need it
})
export class MyFeatureModule {}
```

### Shared Components

Create reusable UI components in `ui/components/`:

```
src/components/my-feature/ui/
├── MyFeaturePage.tsx
└── components/
    ├── Header.tsx
    ├── Footer.tsx
    └── Card.tsx
```

## Examples

### Minimal Feature (no navigation)

```typescript
// component.meta.ts
export const componentMeta: ComponentMeta = {
  id: 'simple',
  title: 'Simple Feature',
  routes: [{ path: '/simple', title: 'Simple Page' }],
} as const;
```

### Feature with Navigation and Assets

```typescript
// component.meta.ts
export const componentMeta: ComponentMeta = {
  id: 'dashboard',
  title: 'Dashboard',
  description: 'User analytics dashboard',
  routes: [
    { path: '/dashboard', title: 'Dashboard Home', isPrimary: true },
    { path: '/dashboard/reports', title: 'Reports' },
  ],
  nav: { label: 'Dashboard', order: 10 },
} as const;

// ui/DashboardPage.tsx
import styles from './dashboard.css';
import chartIcon from './chart-icon.svg';

export function DashboardPage() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      <img src={chartIcon} alt="Charts" />
      <h1>Dashboard</h1>
    </div>
  );
}
```

## Summary

**To add a feature:**
1. Create folder under `src/components/<feature-id>/`
2. Add `component.meta.ts`, `component.module.ts`, `component.controller.ts`
3. Add UI in `ui/` folder
4. Run `npm run start:dev`
5. Your feature is automatically discovered, validated, and registered!

**Key principles:**
- Everything in one folder (self-contained)
- Metadata drives routes and navigation
- Validation catches errors at build time
- HMR makes iteration fast
- No manual registration required

For implementation details, see [COMPONENTS_DISCOVERY_IMPLEMENTATION.md](../implementation_doc/COMPONENTS_DISCOVERY_IMPLEMENTATION.md).
