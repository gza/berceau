# Berceau

A modern, typesafe platform, battery included, for building "admin style" web applications with **NestJS** and **TSX Server-Side Rendering (SSR)**.

"Berceau" means "cradle" in French, symbolizing a confortable place for new ideas to grow.

## 🎯 Project Goal

Berceau provides ~~a production-ready~~ an ⚠️ experimental ⚠️ foundation for building web applications that combine:

- **Focus on the Business**: batteries included, sensible defaults, and clear structure
- **Secure by design**: sensible security defaults and best practices
- **Server-Side Rendering**: Direct UI to Data wiring with no client-side JS by default
- **Full TypeScript**: end-to-end type safety from database to UI
- **Test-Driven Development**: Built-in testing support with Jest and React Testing Library
- **Fast Development**: Hot Module Replacement (HMR) for rapid feedback loops

## Included Batteries

- **JSX Server-Side Rendering** with React's `renderToString`
- **pluggable components**: domain-driven structure, each component owns its controllers, UI, and tests
- **Postgres Database Access**: Type-safe database access with Prisma, client generation by HMR

## Future plans

We at WEBGR will continue to explore and try to use it as a base for new internal projects.

We plan to add more features and improvements over time, including:
- Automatic database CRUD services generation.
- Authentication & Authorization (JWT, OAuth)
- Ready to consume UI components (forms, buttons, tables...)
- HTMX support
- Internationalization (i18n)
- Plugin based structure (so anybody can create its app with plugins and use ones from others)
- CI/CD integration

## ✨ Key Orientations

- **🚀 Server-Side Rendering**: TSX components rendered on the server for fast initial page loads
- **🔥 Hot Module Replacement**: Fast development workflow with ~500ms rebuild times
- **📦 Asset Pipeline**: Automatic asset management (SVG, CSS, images) with webpack
- **🧪 Test-Driven**: Pre-configured Jest with component and integration tests
- **🏗️ Domain-Driven Structure**: Organized by feature domains, not technical layers
- **🎨 CSS Management**: Global and page-specific CSS with proper scoping
- **📘 Type Safety**: Full TypeScript support with strict mode enabled
- **🤖 AI assisted coding**: Try to optimize your code with AI tools (currently GitHub Copilot & specKit)

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Docker (For local development, PostgreSQL will run in a Docker container)

### Installation

```bash
# Install dependencies
npm install

# Start database (using Docker Compose)
docker compose up -d

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Build project (generates Prisma Client)
npm run build

# Run database migrations
npx prisma migrate dev

# Run development server
npm run start:dev

# Run tests
npm run test
```

The application will be available at `http://localhost:3000`

**Note**: See the [Database Integration Guide](docs/dev_guides/DATABASE_INTEGRATION_GUIDE.md) for detailed setup instructions.

## 📁 Project Structure

```
src/
├── systemComponents/           # Feature-based systemComponents
│   ├── about/           # About page feature
│   │   ├── about.controller.ts
│   │   ├── about.module.ts
│   │   └── ui/          # TSX systemComponents
│   ├── core/            # Core layout and routing
│   │   ├── ui/          # Layout systemComponents & global CSS
│   │   └── test/        # Core functionality tests
│   ├── welcome/         # Welcome page feature
│   │   └── ui/          # Page systemComponents & assets
│   └── errors/          # Error handling (404, etc.)
├── ssr/                 # Server-side rendering utilities
├── types/               # TypeScript type definitions
└── main.ts              # Application entry point
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### End-developer Guides

- **[Database Integration Guide](docs/dev_guides/DATABASE_INTEGRATION_GUIDE.md)** - Complete guide to adding database functionality to components
- **[UI Assets Management Guide](docs/dev_guides/UI_ASSETS_MANAGEMENT_GUIDE.md)** - Complete guide to asset management (CSS, images, SVG)
- **[Components Discovery Guide](docs/dev_guides/COMPONENTS_DISCOVERY_GUIDE.md)** - How to use the components discovery system

### Architecture & Design
- **[General Architecture](docs/implementation_doc/GENERAL_ARCHITECTURE.md)** - Overview of the project structure and design decisions
- **[Database Integration Implementation](docs/implementation_doc/DATABASE_INTEGRATION_IMPLEMENTATION.md)** - Database architecture and design decisions
- **[Hot Reload Implementation](docs/implementation_doc/HOT_RELOAD_IMPLEMENTATION.md)** - Webpack HMR setup and configuration
- **[UI Assets Management Implementation](docs/implementation_doc/UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md)** - Technical implementation details (webpack, serving)

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run test` | Run all tests |
| `npm run lint` | Lint (fix) code with ESLint + prettier |

## 🏗️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) 11.x
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.x
- **Build Tool**: [Webpack](https://webpack.js.org/) 5.x (via NestJS CLI)
- **Database**: [Prisma](https://www.prisma.io/) 6.7.0+ with PostgreSQL
- **Testing**: [Jest](https://jestjs.io/)
- **SSR**: TSX Server-Side Rendering with react's `renderToString` + Webpack

## 🚀 Development experience

```ts
// src/components/about/about.controller.ts
import { Controller, Get } from "@nestjs/common"
import { createElement } from "react"
import { renderPage } from "../../ssr/renderPage"
import { AboutPage } from "./ui/AboutPage"

@Controller()
export class AboutController {
  @Get("/about")
  getAbout(): string {
    return renderPage(createElement(AboutPage), {
      title: "About",
      currentPath: "/about",
    })
  }
}
```

```tsx
// src/components/about/ui/AboutPage.tsx
import styles from "./about-page.css"

export function AboutPage() {
  return (
    <div className="about-page">
      <link rel="stylesheet" href={styles} />
      <h1>About Us</h1>
      <p>
        The Berceau project demonstrates a modern web application architecture
        that combines the power of NestJS and React within a single codebase.
      </p>
    </div>
  )
}

```

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgments

This boilerplate demonstrates best practices for:
- Server-side rendering with TSX and NestJS
- TypeScript configuration for full-stack applications
- Domain-driven architecture
- Modern asset management with webpack
- Comprehensive testing strategies

## Contribution

Contributions & ideas are welcome! Please open issues or pull requests.
