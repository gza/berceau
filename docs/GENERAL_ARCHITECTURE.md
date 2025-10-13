# General Architecture

**Project**: NesTsx  
**Type**: NestJS + React Server-Side Rendering (SSR)  
**Last Updated**: October 2025  
**Based on**: Spec 001-initiate-the-application

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Build & Development Pipeline](#build--development-pipeline)
7. [Server-Side Rendering Flow](#server-side-rendering-flow)
8. [Routing Architecture](#routing-architecture)
9. [Asset Handling](#asset-handling)
10. [Testing Strategy](#testing-strategy)
11. [Development Workflow](#development-workflow)
12. [Production Deployment](#production-deployment)

---

## Overview

NesTsx is a **unified web application** that combines NestJS backend services with React frontend components in a single codebase. The architecture follows a **domain-driven design** where UI and backend logic are co-located by feature, creating self-contained, maintainable modules.

### Key Characteristics

- **Server-Side Rendering (SSR)**: All React components are rendered on the server for optimal performance and SEO
- **Single Project**: Backend and frontend in one unified codebase
- **Domain-Driven**: Features organized by domain (welcome, about, errors, core)
- **Hot Module Replacement**: Fast development iteration with ~500ms rebuilds
- **Type-Safe**: Full TypeScript coverage with strict mode
- **Test-Driven**: Comprehensive test coverage with Jest and React Testing Library

---

## Architecture Principles

These principles guide all architectural decisions (from `.specify/memory/constitution.md`):

### I. Service-Oriented Architecture
Features are organized as self-contained services with clear boundaries. Each domain module contains its own controllers, services, UI components, and tests.

### II. Server-Side Rendering (SSR) with JSX
All UI is rendered on the server using React's `renderToString`. This ensures:
- Fast initial page load
- SEO-friendly content
- Progressive enhancement
- No client-side JavaScript hydration (currently)

### III. Future-Ready Service Extensions
Domain modules are designed for potential extraction into separate services or extensions. Co-location of UI and backend code creates natural boundaries.

### IV. Test-Driven Development (TDD)
Tests are written before implementation:
- Contract tests define service boundaries
- Integration tests validate user journeys
- Unit tests ensure component behavior

---

## Technology Stack

### Backend
- **NestJS 11.1.6**: Backend framework with dependency injection and modular architecture
- **Express 5.1.0**: HTTP server (NestJS default adapter)
- **TypeScript 5.9.2**: Type-safe JavaScript with strict mode
- **Node.js 20.x**: Runtime environment

### Frontend
- **React 19.1.1**: UI library for component-based development
- **React DOM Server**: Server-side rendering with `renderToString`
- **TSX/JSX**: TypeScript + JSX syntax (compiled with `react-jsx` transform)

### Build System
- **Webpack 5.100.2**: Module bundler (via NestJS CLI)
- **webpack-hmr.config.js**: Custom configuration for hot reload
- **ts-loader 9.5.4**: TypeScript compilation in webpack
- **mini-svg-data-uri 1.4.4**: SVG optimization for data URIs
- **run-script-webpack-plugin 0.2.3**: Auto-restart server on changes

### Testing
- **Jest 30.1.3**: Test runner and framework
- **React Testing Library 16.3.0**: Component testing utilities
- **@testing-library/jest-dom 6.8.0**: DOM matchers
- **Supertest 7.1.4**: HTTP assertion library

### Development Tools
- **ESLint 9.36.0**: Code linting with TypeScript support
- **Prettier**: Code formatting (via NestJS defaults)
- **Hot Module Replacement**: Fast rebuilds (~500ms)

---

## Project Structure

```
nestsx/
├── src/
│   ├── main.ts                          # Application entry point (Bootstrap + HMR)
│   ├── app.module.ts                    # Root NestJS module
│   ├── entry-server.tsx                 # SSR entry point (exports render function)
│   │
│   ├── components/                      # Domain-driven feature modules
│   │   ├── core/                        # Core infrastructure (layout, SSR)
│   │   │   ├── core.module.ts          # Core NestJS module
│   │   │   ├── pages.controller.ts     # Main page routes (/, /about)
│   │   │   ├── ui/                     # Core UI components
│   │   │   │   ├── AppLayout.tsx       # Main layout wrapper
│   │   │   │   ├── HtmlDocument.tsx    # HTML document structure
│   │   │   │   ├── LeftMenu.tsx        # Navigation menu
│   │   │   │   └── LeftMenu.spec.tsx   # Unit tests
│   │   │   └── test/
│   │   │       └── contract/
│   │   │           └── ssr.contract.spec.ts  # SSR contract tests
│   │   │
│   │   ├── welcome/                     # Welcome page domain
│   │   │   ├── ui/
│   │   │   │   ├── WelcomePage.tsx
│   │   │   │   ├── WelcomePage.spec.tsx
│   │   │   │   └── welcome.svg         # Co-located SVG asset
│   │   │   └── test/
│   │   │       └── integration/
│   │   │           └── welcome-page.integration.spec.tsx
│   │   │
│   │   ├── about/                       # About page domain
│   │   │   ├── about.module.ts
│   │   │   ├── about.controller.ts
│   │   │   ├── ui/
│   │   │   │   ├── AboutPage.tsx
│   │   │   │   └── AboutPage.spec.tsx
│   │   │   └── test/
│   │   │       └── integration/
│   │   │           └── about-page.integration.spec.tsx
│   │   │
│   │   └── errors/                      # Error handling domain
│   │       ├── errors.module.ts
│   │       ├── errors.controller.ts
│   │       ├── ui/
│   │       │   ├── NotFoundPage.tsx
│   │       │   └── NotFoundPage.spec.tsx
│   │       └── test/
│   │           └── integration/
│   │               └── not-found.integration.spec.tsx
│   │
│   ├── ssr/                             # SSR utilities
│   │   ├── renderPage.tsx              # Main rendering function
│   │   └── renderPage.spec.tsx         # Render tests
│   │
│   ├── types/                           # TypeScript type definitions
│   │   └── svg.d.ts                    # SVG module declarations
│   │
│   └── setupTests.ts                    # Jest setup for React Testing Library
│
├── docs/                                # Documentation
│   ├── GENERAL_ARCHITECTURE.md         # This file
│   ├── SVG_ASSETS_GUIDE.md            # Asset handling guide
│   └── HOT_RELOAD_IMPLEMENTATION.md   # HMR implementation details
│
├── specs/                               # Feature specifications
│   └── 001-initiate-the-application/
│       ├── spec.md                     # Feature specification
│       ├── plan.md                     # Implementation plan
│       ├── research.md                 # Technical research
│       ├── data-model.md              # Data structures
│       ├── quickstart.md              # Setup guide
│       ├── tasks.md                   # Implementation tasks
│       └── contracts/                 # API contracts
│           └── README.md
│
├── webpack-hmr.config.js               # Webpack HMR configuration
├── nest-cli.json                       # NestJS CLI configuration
├── tsconfig.json                       # TypeScript configuration
├── jest.config.js                      # Jest test configuration
├── eslint.config.mjs                   # ESLint configuration
└── package.json                        # Dependencies and scripts
```

### Directory Organization Principles

1. **Domain Co-location**: Each feature/domain contains all its code (UI, backend, tests)
2. **Test Proximity**: Tests live close to the code they test (`*.spec.tsx` for units, `test/` for integration)
3. **UI Separation**: UI components in `ui/` subdirectory within each domain
4. **Shared Code**: Core infrastructure and utilities in `core/` and `ssr/`

---

## Core Components

### 1. Application Bootstrap (`src/main.ts`)

**Purpose**: Initialize NestJS application, configure middleware, enable HMR

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  
  // Serve static assets
  app.useStaticAssets(join(__dirname, "public"), { prefix: "/" })
  
  await app.listen(3000)
  
  // Hot Module Replacement hooks
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
```

**Key Features**:
- Creates NestJS application with Express adapter
- Configures static asset serving from `dist/public/`
- Sets up HMR for fast development iteration
- Handles graceful shutdown

### 2. Root Module (`src/app.module.ts`)

**Purpose**: Wire together all domain modules

```typescript
@Module({
  imports: [AboutModule, CoreModule, ErrorsModule],
})
export class AppModule {}
```

**Design Pattern**: Modular architecture - each domain is a self-contained NestJS module

### 3. SSR Entry Point (`src/entry-server.tsx`)

**Purpose**: Export the main rendering function for use by controllers

```typescript
export { renderPage as render } from "./ssr/renderPage"
```

**Why Separate File**: 
- Clean contract for controllers to import
- Decouples SSR implementation from API
- Can be extended with different render strategies

### 4. Render Engine (`src/ssr/renderPage.tsx`)

**Purpose**: Core SSR logic - convert React components to HTML

```typescript
export function renderPage(content: ReactElement, options: RenderPageOptions = {}) {
  const view = renderToString(
    <HtmlDocument title={options.title} scripts={options.scripts}>
      <AppLayout currentPath={options.currentPath}>
        {content}
      </AppLayout>
    </HtmlDocument>
  )
  return `<!DOCTYPE html>${view}`
}
```

**Architecture**:
- Wraps page content in layout (`AppLayout`)
- Wraps layout in HTML document (`HtmlDocument`)
- Uses React's `renderToString` for SSR
- Returns complete HTML5 document

**Options**:
- `title`: Page title for `<title>` tag
- `scripts`: Array of script URLs to include
- `currentPath`: Current URL path for navigation highlighting

### 5. Controllers (Domain-Specific)

**Purpose**: Handle HTTP requests and return rendered HTML

**Example** (`src/components/core/pages.controller.ts`):
```typescript
@Controller()
export class PagesController {
  @Get("/")
  getWelcome(): string {
    return renderPage(createElement(WelcomePage), {
      title: "Welcome",
      currentPath: "/",
    })
  }
}
```

**Pattern**:
- Each route returns rendered HTML string
- Uses `createElement` to create React element from component
- Passes page-specific options to `renderPage`
- No async operations (pure rendering)

### 6. Layout Components

#### `HtmlDocument.tsx`
**Purpose**: HTML document structure (`<html>`, `<head>`, `<body>`)

**Features**:
- Sets document language and charset
- Includes page title
- Injects script tags
- Provides viewport meta tag

#### `AppLayout.tsx`
**Purpose**: Application layout with navigation and content area

**Features**:
- Renders `LeftMenu` for navigation
- Provides main content area
- Consistent layout across all pages

#### `LeftMenu.tsx`
**Purpose**: Navigation menu component

**Features**:
- Renders navigation links
- Highlights current page
- Uses semantic HTML (`<nav>`, `<ul>`, `<li>`)

### 7. Page Components

Each page component follows this pattern:

```typescript
interface Props {
  // Page-specific props
}

export function PageName(props: Props) {
  return (
    <div>
      {/* Page content */}
    </div>
  )
}
```

**Characteristics**:
- Exported named function (not default export)
- Props interface defined
- Pure function (no hooks, no state)
- Server-safe (no browser APIs)

---

## Build & Development Pipeline

### Development Flow

```
Source Code (src/)
    ↓
webpack-hmr.config.js (NestJS CLI + webpack)
    ├── TypeScript Compilation (ts-loader)
    ├── SVG Processing (asset/inline + mini-svg-data-uri)
    ├── Hot Module Replacement (webpack/hot/poll?100)
    └── Auto-restart (RunScriptWebpackPlugin)
    ↓
Compiled Bundle (dist/main.js)
    ↓
Node.js Runtime
    ↓
NestJS Application
    └── Server running on http://localhost:3000
```

### Webpack Configuration

**File**: `webpack-hmr.config.js`

**Purpose**: Extend NestJS default webpack config for HMR and asset handling

**Key Features**:

1. **HMR Entry Point**:
   ```javascript
   entry: ['webpack/hot/poll?100', options.entry]
   ```
   Adds HMR polling client before main entry

2. **Externals Configuration**:
   ```javascript
   externals: [
     nodeExternals({
       allowlist: ['webpack/hot/poll?100', /\.svg$/],
     }),
   ]
   ```
   Excludes node_modules but allows HMR client and SVGs to be processed

3. **SVG Processing**:
   ```javascript
   {
     test: /\.svg$/,
     type: 'asset',
     generator: {
       dataUrl: content => svgToMiniDataURI(content.toString())
     }
   }
   ```
   Converts SVGs to optimized data URIs

4. **HMR Plugins**:
   - `HotModuleReplacementPlugin`: Enables HMR
   - `WatchIgnorePlugin`: Ignores compiled JS and type definition files
   - `RunScriptWebpackPlugin`: Auto-restarts server on changes

### Build Scripts

**From `package.json`**:

```json
{
  "build": "nest build --webpack --webpackPath webpack-hmr.config.js",
  "build:prod": "webpack --mode production",
  "start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js --watch",
  "start": "node dist/main.js"
}
```

**Development** (`npm run start:dev`):
- Builds with webpack HMR config
- Watches for file changes
- Rebuilds incrementally (~500ms)
- Auto-restarts server

**Production** (`npm run build` + `npm start`):
- Full build with optimizations
- No HMR overhead
- Single `dist/main.js` bundle

### TypeScript Configuration

**File**: `tsconfig.json`

**Key Settings**:
```json
{
  "jsx": "react-jsx",           // Modern React JSX transform
  "strict": true,               // Strict type checking
  "target": "ES2020",           // Modern JavaScript features
  "module": "commonjs",         // Node.js module system
  "esModuleInterop": true,      // Better import compatibility
  "typeRoots": ["./node_modules/@types", "./src/types"]
}
```

---

## Server-Side Rendering Flow

### Request Flow

```
HTTP Request (GET /)
    ↓
NestJS Routing
    ↓
PagesController.getWelcome()
    ↓
createElement(WelcomePage)
    ↓
renderPage(element, options)
    ↓
┌─────────────────────────────────┐
│   renderToString(               │
│     <HtmlDocument>              │
│       <AppLayout>               │
│         <WelcomePage />         │
│       </AppLayout>              │
│     </HtmlDocument>             │
│   )                             │
└─────────────────────────────────┘
    ↓
HTML String
    ↓
HTTP Response (200 OK)
    ↓
Client Browser (Receives complete HTML)
```

### Rendering Layers

1. **Controller Layer**: Routes requests to appropriate page component
2. **Render Function**: Wraps content in layout and document structure
3. **React SSR**: Converts React elements to HTML string
4. **HTTP Response**: Sends complete HTML to client

### No Client-Side Hydration

**Current Implementation**: Pure SSR without client-side JavaScript

**Benefits**:
- Fastest initial load (no JS to download/parse)
- Maximum accessibility (works without JS)
- Simpler architecture (no hydration mismatches)

**Trade-offs**:
- No client-side interactivity (full page reloads)
- No dynamic updates without server round-trip

**Future Enhancement**: Could add React hydration for interactivity

---

## Routing Architecture

### Server-Side Routing (NestJS)

**Pattern**: Declarative routes in controllers using decorators

```typescript
@Controller()
export class PagesController {
  @Get("/")               // Route: GET /
  getWelcome() { ... }
  
  @Get("/about")          // Route: GET /about (in AboutController)
  getAbout() { ... }
}

@Controller()
export class ErrorsController {
  @Get("*")               // Catch-all: Any unmatched route
  getNotFound() { ... }
}
```

### Route Organization

| Route | Controller | Module | Page Component |
|-------|-----------|--------|----------------|
| `GET /` | `PagesController` | `CoreModule` | `WelcomePage` |
| `GET /about` | `AboutController` | `AboutModule` | `AboutPage` |
| `GET *` | `ErrorsController` | `ErrorsModule` | `NotFoundPage` |

### Navigation Links

**Defined in**: `LeftMenu.tsx`

```typescript
const navLinks = [
  { label: "Welcome", path: "/" },
  { label: "About", path: "/about" },
]
```

**Navigation Behavior**:
- Links are standard `<a>` tags
- Clicking triggers full page load (server renders new page)
- Current page highlighted using `currentPath` prop

### Adding New Routes

**Steps**:
1. Create domain module (if new feature area)
2. Create controller with `@Get()` route
3. Create page component in `ui/` subdirectory
4. Import and render component in controller
5. Add navigation link to `LeftMenu.tsx` (if needed)

**Example**:
```typescript
// 1. Create controller
@Controller()
export class ContactController {
  @Get("/contact")
  getContact(): string {
    return renderPage(createElement(ContactPage), {
      title: "Contact Us",
      currentPath: "/contact",
    })
  }
}

// 2. Create page component
export function ContactPage() {
  return <div><h1>Contact Us</h1></div>
}

// 3. Add to LeftMenu
const navLinks = [
  { label: "Welcome", path: "/" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },  // New link
]
```

---

## Asset Handling

### SVG Assets

**Strategy**: Direct imports processed by webpack into optimized data URIs

**Implementation**:

1. **Place SVG with component**:
   ```
   src/components/welcome/ui/
   ├── WelcomePage.tsx
   └── welcome.svg
   ```

2. **Import in component**:
   ```tsx
   import welcomeSvg from "./welcome.svg"
   
   export function WelcomePage() {
     return <img src={welcomeSvg} alt="Welcome" />
   }
   ```

3. **Webpack processes**:
   - Reads SVG file
   - Optimizes with `mini-svg-data-uri` (~20% smaller than base64)
   - Generates data URI: `data:image/svg+xml,...`
   - Replaces import with string

4. **Result**: `welcomeSvg` is a string containing the data URI

**Type Safety**: `src/types/svg.d.ts` provides TypeScript definitions:
```typescript
declare module "*.svg" {
  const content: string
  export default content
}
```

**Benefits**:
- ✅ Compile-time validation (TypeScript knows about imports)
- ✅ No separate HTTP requests (embedded in bundle)
- ✅ Works in SSR (no file system access needed)
- ✅ Automatic optimization
- ✅ Hot reload support

**Trade-offs**:
- ⚠️ Larger bundle size (SVGs embedded as data URIs)
- ⚠️ Best for small-to-medium SVGs (<50KB)
- ⚠️ Consider alternatives for large images

**See**: `docs/SVG_ASSETS_GUIDE.md` for detailed guide

### Static Assets (Future)

**Not currently used**, but configured in `nest-cli.json`:

```json
{
  "compilerOptions": {
    "assets": [
      {
        "include": "**/*.svg",
        "outDir": "dist/public/assets",
        "watchAssets": true
      }
    ]
  }
}
```

This would copy assets to `dist/public/assets/` for CDN delivery if needed.

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \  Unit Tests (~60%)
       /────\
      / Integ \  Integration Tests (~30%)
     /────────\
    / Contract \  Contract Tests (~10%)
   /──────────\
```

### 1. Contract Tests

**Purpose**: Validate service boundaries and API contracts

**Location**: `src/components/*/test/contract/`

**Example** (`ssr.contract.spec.ts`):
```typescript
it('should return valid HTML for root path', async () => {
  const response = await request(app.getHttpServer())
    .get('/')
    .expect(200)
    .expect('Content-Type', /html/)
  
  expect(response.text).toContain('<!DOCTYPE html>')
})
```

**Characteristics**:
- Test HTTP endpoints directly
- Assert response structure and status codes
- No implementation details
- Fast execution

### 2. Integration Tests

**Purpose**: Validate complete user journeys

**Location**: `src/components/*/test/integration/`

**Example** (`welcome-page.integration.spec.tsx`):
```typescript
it('should render Welcome page with heading', async () => {
  const html = renderPage(createElement(WelcomePage), {
    title: 'Welcome',
    currentPath: '/',
  })
  
  const { getByRole } = render(html)
  expect(getByRole('heading')).toHaveTextContent('Welcome to the NesTsx')
})
```

**Characteristics**:
- Test entire rendering flow
- Simulate user interactions (future: with Testing Library)
- Assert on rendered output
- Medium execution speed

### 3. Unit Tests

**Purpose**: Test individual components in isolation

**Location**: Next to component (`*.spec.tsx`)

**Example** (`LeftMenu.spec.tsx`):
```typescript
it('should render navigation links', () => {
  const { getByText } = render(<LeftMenu currentPath="/" />)
  
  expect(getByText('Welcome')).toBeInTheDocument()
  expect(getByText('About')).toBeInTheDocument()
})

it('should highlight current page', () => {
  const { getByText } = render(<LeftMenu currentPath="/about" />)
  
  const aboutLink = getByText('About').closest('a')
  expect(aboutLink).toHaveAttribute('aria-current', 'page')
})
```

**Characteristics**:
- Test single component
- Mock dependencies
- Fast execution
- High coverage

### Test Configuration

**File**: `jest.config.js`

**Key Settings**:
```javascript
module.exports = {
  testEnvironment: 'jsdom',                    // DOM environment for React
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/__mocks__/fileMock.js',  // Mock SVGs in tests
    '\\.css$': 'identity-obj-proxy',           // Mock CSS
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',             // TypeScript/TSX transform
  },
}
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage
```

### Test-Driven Development Flow

1. **Write failing test** (Red)
   ```typescript
   it('should render contact form', () => {
     const { getByLabelText } = render(<ContactPage />)
     expect(getByLabelText('Email')).toBeInTheDocument()
   })
   ```

2. **Implement minimal code** (Green)
   ```tsx
   export function ContactPage() {
     return <input type="email" aria-label="Email" />
   }
   ```

3. **Refactor** (Refactor)
   ```tsx
   export function ContactPage() {
     return (
       <form>
         <label htmlFor="email">Email</label>
         <input id="email" type="email" />
       </form>
     )
   }
   ```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd nestsx

# Install dependencies
npm install

# Run tests (should all pass)
npm test

# Start development server
npm run start:dev
```

### Daily Development

1. **Start dev server**:
   ```bash
   npm run start:dev
   ```
   Server runs on http://localhost:3000 with hot reload

2. **Make changes**:
   - Edit files in `src/`
   - Webpack detects changes
   - Rebuilds in ~500ms
   - Server auto-restarts
   - Refresh browser to see changes

3. **Run tests**:
   ```bash
   npm test              # Full suite
   npm run test:watch    # Watch mode
   ```

4. **Lint code**:
   ```bash
   npm run lint          # Check and fix
   ```

### Adding New Features

**Process**:

1. **Create specification** in `specs/NNN-feature-name/`:
   - `spec.md` - Feature requirements
   - `plan.md` - Implementation plan
   - `research.md` - Technical research
   - `tasks.md` - Task breakdown

2. **Write tests first** (TDD):
   - Contract tests (API boundaries)
   - Integration tests (user journeys)
   - Unit tests (components)

3. **Implement incrementally**:
   - Create domain module
   - Create controller
   - Create page component
   - Make tests pass

4. **Document**:
   - Update architecture docs if needed
   - Add usage examples
   - Update navigation if public feature

### Hot Reload Behavior

**What triggers reload**:
- TypeScript files (`*.ts`, `*.tsx`)
- SVG imports (`*.svg`)
- Component changes
- Controller changes

**What requires restart**:
- `main.ts` changes
- Dependency changes
- Environment variables
- Configuration files

**Performance**:
- First build: ~1970ms
- Rebuilds: ~500ms
- Server restart: <100ms

---

## Production Deployment

### Build for Production

```bash
# Full production build
npm run build

# Output: dist/main.js (single bundle)
```

### Production Configuration

**Differences from development**:
- No HMR overhead
- Optimized bundle size
- Source maps for debugging
- Environment variables from process.env

### Running in Production

```bash
# Set environment
export NODE_ENV=production

# Start server
npm start

# Or use process manager
pm2 start dist/main.js --name nestsx
```

### Deployment Checklist

- [ ] Run full test suite: `npm test`
- [ ] Build production bundle: `npm run build`
- [ ] Set `NODE_ENV=production`
- [ ] Configure environment variables
- [ ] Set up process manager (PM2, systemd)
- [ ] Configure reverse proxy (nginx, Apache)
- [ ] Set up SSL/TLS certificates
- [ ] Configure monitoring and logging
- [ ] Set up automated deployments

### Performance Considerations

**Bundle Size**:
- Monitor SVG data URIs (embedded in bundle)
- Consider lazy loading for large features
- Use compression (gzip/brotli) at reverse proxy

**Caching**:
- Set cache headers for static assets
- Use content-hash filenames for versioning
- Configure CDN if needed

**SSR Performance**:
- React SSR is CPU-bound
- Consider caching rendered pages
- Monitor memory usage
- Scale horizontally if needed

---

## Summary

### Current State

✅ **Implemented**:
- NestJS + React SSR architecture
- Domain-driven module structure
- Hot Module Replacement for fast development
- Webpack-based SVG imports with data URIs
- Comprehensive test coverage (contract, integration, unit)
- Type-safe TypeScript throughout
- Core pages: Welcome, About, 404

✅ **Documented**:
- Architecture overview (this document)
- SVG asset handling guide
- Hot reload implementation details
- Feature specifications and plans

### Future Enhancements

**Potential Extensions**:
- Client-side hydration for interactivity
- API endpoints for data fetching
- Database integration
- Authentication and authorization
- Progressive Web App (PWA) features
- Client-side routing (React Router)
- State management (if needed)
- Form handling and validation
- Internationalization (i18n)

**Scalability Considerations**:
- Extract domains into separate services
- Add API gateway
- Implement microservices architecture
- Add message queue for async tasks
- Implement caching layer
- Add CDN for static assets

---

**Maintained by**: Development Team  
**Version**: 1.0.0  
**Last Review**: October 2025  
**Next Review**: After major feature additions

For questions or clarifications, see:
- `docs/SVG_ASSETS_GUIDE.md` - Asset handling details
- `docs/HOT_RELOAD_IMPLEMENTATION.md` - HMR setup details
- `specs/001-initiate-the-application/` - Initial implementation specs
