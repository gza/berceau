# General Architecture — Concise Summary

Project: NesTsx
Type: NestJS + TSX Server‑Side Rendering (SSR)

This document provides a focused overview of the unique architectural aspects of NesTsx. It intentionally avoids duplicating the Quick Start, scripts, and basic structure already covered in `README.md`, and skips deep HMR/asset specifics documented in `docs/HOT_RELOAD_IMPLEMENTATION.md` and the UI assets docs (`docs/UI_ASSETS_MANAGEMENT_*.md`).

## Goals and Core Ideas

- Single codebase combining NestJS backend and TSX UI with server-side rendering.
- Domain-driven co-location: each feature holds its controllers, UI, and tests.
- Fully server-rendered pages: no client-side hydration by default for simplicity and speed.
- Strict TypeScript with end-to-end types, predictable builds, and testable outputs.

## What Makes This Architecture Distinct

- Server-side only React usage: components render to HTML via `renderToString`, producing a complete document, not fragments.
- SSR as contract: controllers return HTML strings; pages are pure functions, no browser APIs.
- Co-located assets (CSS/SVG) imported directly from components; the bundler outputs SSR-safe artifacts.
- HMR-dev experience with near-instant rebuilds, while keeping production bundles lean.

## High-Level Flow

1. HTTP request hits a NestJS controller route.
2. Controller creates a React element for a page and calls `renderPage`.
3. `renderPage` wraps content with layout and HTML document structure.
4. React DOM Server converts the tree to a string.
5. Controller returns a full HTML document string to the client.

No runtime React on the client by default; navigation is standard links and full reloads.

## Modules and Boundaries

- AppModule wires feature modules only (no shared stateful singletons for UI).
- Feature modules (welcome, about, errors, core) are bounded contexts: each owns its routing, UI, and tests.
- Core module provides infrastructure UI (layout/document/menu) and common controllers (pages router).
- Errors module owns the catch‑all (404) route; it doesn’t bleed concerns into other modules.

## Rendering Contract (SSR)

- Input: a page React element and optional render options.
- Output: a complete HTML5 string.
- Options supported:
  - `title`: string for `<title>`
  - `currentPath`: used for nav highlighting
  - `scripts`: optional array of script URLs (kept minimal in current SSR‑only approach)
- Invariants:
  - Result always starts with `<!DOCTYPE html>`. 
  - Document structure provided by `HtmlDocument` and `AppLayout` wrappers.
  - Content is pure and deterministic (no random/time side effects in render path).

## Page Components Philosophy

- Pure functions with explicit props; no hooks/state/effects.
- Server-safe (no `window`, `document`, or timers).
- Co-located styling: page CSS is imported and referenced within component output.
- Predictable HTML output enables stable tests (unit, integration, contract).

## Routing Model

- Classic NestJS controllers with `@Controller`/`@Get` decorators.
- Each feature declares its routes where it makes sense (e.g., `core/pages.controller.ts`).
- A dedicated 404 handler lives in `errors` and is registered last via module import order.
- Navigation links are simple anchors; `currentPath` controls active styling server-side.

## Directory Organization Principles

- Feature-first: `src/systemComponents/<feature>/` with `ui/`, optional controller(s), and tests nearby.
- Infrastructure in `src/systemComponents/core` and SSR helpers in `src/ssr/`.
- Type declarations in `src/types/` to keep imports type-safe (e.g., `*.svg`).
- Tests:
  - Unit: `*.spec.tsx` close to components.
  - Integration: `test/integration/` per feature.
  - Contract: `core/test/contract/` for SSR invariants.

## Key Source Elements (Essentials Only)

- `src/main.ts`: Bootstraps Nest app and development HMR entry.
- `src/app.module.ts`: Aggregates feature modules.
- `src/entry-server.tsx`: Re-exports `renderPage` as the rendering entry point.
- `src/ssr/renderPage.tsx`: SSR pipeline building the full document string.
- `src/systemComponents/core/ui/HtmlDocument.tsx`: `<html>`, `<head>`, `<body>` structure.
- `src/systemComponents/core/ui/AppLayout.tsx`: Structural layout and nav region.
- `src/systemComponents/core/ui/LeftMenu.tsx`: Server-rendered navigation links.

## Testing Strategy (Architectural Angle)

- Contract tests ensure the SSR contract: full HTML document returned; headers/doctype present.
- Integration tests exercise routes end-to-end via HTTP and assert rendered content.
- Unit tests verify component markup given props (deterministic rendering guarantees stability).
- Jest environment is configured for TSX testing without browser hydration.

## Constraints and Trade‑offs

- Pros:
  - Very fast first paint; minimal client weight.
  - Strong SSR determinism simplifies testing and debugging.
  - Lower complexity vs. isomorphic apps.
- Cons:
  - No client-side interactivity by default; every action reloads.
  - Embedded assets (e.g., small SVGs) increase server bundle size.
  - Requires discipline to keep render path pure and side-effect free.

## Extensibility Patterns

- Add a feature: create a module, routes, and a `ui/` folder; export page(s) and wire in `AppModule`.
- Share structure through composition: Layout/Document wrap all pages; add slots as needed.
- Progressive enhancement path: selectively introduce client scripts via `scripts` option and hydrate specific islands later.

## Performance & Operations

- Dev: hot reload with near‑instant rebuilds through a lightweight webpack setup dedicated to Node SSR.
- Prod: single server bundle; static files (if any) can be served by Express or fronted by a CDN.
- Observability (future): add request logging and render timing around `renderPage` as middleware/services.

## Safety & Purity Guidelines

- Never access browser globals in components.
- Keep props serializable and render‑pure; prefer derived values during render.
- Validate external inputs at controller boundaries before rendering.
- Keep critical layout and document components tiny and stable; tests should pin their contracts.

## When to Add Client JS

- Only when a specific interaction justifies it (forms with dynamic validation, widgets, etc.).
- Scope JS to a page or component; include via `scripts` option.
- Consider island architecture for partial hydration; avoid global SPA complexity unless necessary.

## Minimal Example (Controller -> Page)

```ts
// Controller
@Get("/about")
getAbout(): string {
  return renderPage(createElement(AboutPage), {
    title: "About",
    currentPath: "/about",
  })
}
```

```tsx
// Page Component
import styles from "./about-page.css"
export function AboutPage() {
  return (
    <div className="about-page">
      <link rel="stylesheet" href={styles} />
      <h1>About</h1>
    </div>
  )
}
```

## Future Directions (Non‑Goals for Now)

- Hydration and client routing (possible later via islands or React hydrateRoot).
- Data fetching layers (e.g., Prisma) and state management (server‑only for now).
- Plugin system for features, auth, and i18n once core composition patterns are stable.

---

References:
- `README.md` for setup, scripts, and quick start.
- `docs/HOT_RELOAD_IMPLEMENTATION.md` for HMR mechanics.
- `docs/UI_ASSETS_MANAGEMENT_GUIDE.md` and `docs/UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md` for asset handling.
