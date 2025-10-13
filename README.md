# NesTsx

A modern, typesafe boilerplate for building full-stack web applications with **NestJS** and **TSX Server-Side Rendering (SSR)**.

pronouce "Nes-T-S-X" 

## 🎯 Project Goal

NesTsx provides ~~a production-ready~~ an ⚠️ experimental ⚠️ foundation for building web applications that combine:

- **Backend**: NestJS framework with TypeScript for robust and full featured server architecture
- **Frontend**: TSX components with server-side rendering for simplicity and typesafe robustness
- **Type Safety**: End-to-end TypeScript coverage for both client and server code
- **Asset Management**: Webpack-powered asset handling with hot module replacement
- **Testing**: Comprehensive test coverage with Jest

This boilerplate eliminates the complexity of setting up SSR with NestJS, providing a clean, maintainable architecture out of the box.

## ✨ Key Orientations

- **🚀 Server-Side Rendering**: TSX components rendered on the server for fast initial page loads
- **🔥 Hot Module Replacement**: Fast development workflow with ~500ms rebuild times
- **📦 Asset Pipeline**: Automatic asset management (SVG, CSS, images) with webpack
- **🧪 Test-Driven**: Pre-configured Jest with component and integration tests
- **🏗️ Domain-Driven Structure**: Organized by feature domains, not technical layers
- **🎨 CSS Management**: Global and page-specific CSS with proper scoping
- **📘 Type Safety**: Full TypeScript support with strict mode enabled

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/           # Feature-based components
│   ├── about/           # About page feature
│   │   ├── about.controller.ts
│   │   ├── about.module.ts
│   │   └── ui/          # TSX components
│   ├── core/            # Core layout and routing
│   │   ├── ui/          # Layout components & global CSS
│   │   └── test/        # Core functionality tests
│   ├── welcome/         # Welcome page feature
│   │   └── ui/          # Page components & assets
│   └── errors/          # Error handling (404, etc.)
├── ssr/                 # Server-side rendering utilities
├── types/               # TypeScript type definitions
└── main.ts              # Application entry point
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Architecture & Design
- **[General Architecture](docs/GENERAL_ARCHITECTURE.md)** - Overview of the project structure and design decisions
- **[Domain-Driven Structure](docs/DOMAIN_DRIVEN_STRUCTURE.md)** - Organizing code by business domains

### Development Guides
- **[Hot Reload Implementation](docs/HOT_RELOAD_IMPLEMENTATION.md)** - Webpack HMR setup and configuration
- **[Assets Guide](docs/ASSETS_GUIDE.md)** - Complete guide to asset management (CSS, images, SVG)
- **[Assets Quick Reference](docs/ASSETS_QUICK_REFERENCE.md)** - Quick reference for asset imports

### Testing
- **[Testing Strategy](docs/TESTING_STRATEGY.md)** - Approach to testing SSR applications
- **[Test Setup Guide](docs/TEST_SETUP_GUIDE.md)** - Configuring Jest for SSR components

### API & Integration
- **[SSR API](docs/SSR_API.md)** - Server-side rendering API documentation

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint (fix) code with ESLint + prettier |

## 🏗️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) 11.x
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.x
- **Build Tool**: [Webpack](https://webpack.js.org/) 5.x (via NestJS CLI)
- **Testing**: [Jest](https://jestjs.io/)
- **SSR**: TSX Server-Side Rendering with react's `renderToString` + Webpack

## 🎨 Asset Management

NesTsx includes a simple asset management system:

- **CSS Files**: Global and page-specific stylesheets with proper scoping
- **Images**: SVG, PNG, JPG, WebP with automatic optimization
- **Type Safety**: TypeScript definitions for all asset imports
- **Hot Reload**: Asset changes trigger fast rebuilds

Example:
```tsx
import logo from "./logo.svg"
import styles from "./page.css"

export function MyComponent() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      <img src={logo} alt="Logo" />
    </div>
  )
}
```

See the [Assets Guide](docs/ASSETS_GUIDE.md) for complete documentation.

## 🧪 Testing

The project includes comprehensive testing setup:

- **Component Tests**: React component unit tests
- **Integration Tests**: Full page rendering tests
- **Contract Tests**: API endpoint validation
- **SSR Tests**: Server-side rendering verification

Tests are organized by domain and separated into `node-tests` (server) and `react-tests` (components).

## 📝 Code Style

The project follows strict TypeScript and ESLint rules:

- Strict TypeScript mode enabled
- ESLint with recommended rules
- Component-level type definitions
- Proper error handling

## 🤝 Contributing

1. Follow the existing project structure
2. Write tests for new features
3. Update documentation as needed
4. Run `npm run lint` and `npm run test` before committing

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgments

This boilerplate demonstrates best practices for:
- Server-side rendering with TSX and NestJS
- TypeScript configuration for full-stack applications
- Domain-driven architecture
- Modern asset management with webpack
- Comprehensive testing strategies

---

**Ready to build something amazing?** Check out the [General Architecture](docs/GENERAL_ARCHITECTURE.md) documentation to get started!
