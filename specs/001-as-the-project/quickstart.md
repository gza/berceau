# Quickstart: Adding a drop-in feature

1) Create a folder:
- src/components/<feature-id>/

2) Create metadata file `component.meta.ts`:
```typescript
import type { FeatureMeta } from '../types';

export const featureMeta: FeatureMeta = {
  id: 'demo',
  title: 'Demo Feature',
  routes: [
    { path: '/demo', title: 'Demo Page', isPrimary: true },
  ],
  nav: { label: 'Demo', order: 100 },
} as const;
```

3) Add a NestJS module and controller:
```typescript
// component.module.ts
import { Module } from '@nestjs/common';
import { DemoController } from './feature.controller';

@Module({ controllers: [DemoController] })
export class DemoFeatureModule {}

// component.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { renderPage } from '../../ssr/renderPage';
import { DemoPage } from './ui/DemoPage';

@Controller()
export class DemoController {
  @Get('/demo')
  async demo(@Res() res: Response) {
    const html = await renderPage({ page: DemoPage, props: { title: 'Demo' } });
    res.status(200).send(html);
  }
}
```

4) Create UI:
```typescript
// ui/DemoPage.tsx
export function DemoPage() {
  return <div>Demo works</div>;
}
```

5) Run dev server. The build will discover your feature and register routes. Validation errors will appear in the terminal and block HMR until fixed.
