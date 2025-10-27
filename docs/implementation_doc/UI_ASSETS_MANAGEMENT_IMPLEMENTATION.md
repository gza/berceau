# UI Assets Management Implementation — Webpack File Copying

[Looking for usage examples? Read the UI Development Guide.](../dev_guides/UI_DEV_GUIDE.md)

Audience: maintainers/architects. This document explains how asset imports are implemented and served.

## High-level Flow

1) Components import assets (TS/TSX).  
2) Webpack treats these as `asset/resource` and copies files to `dist/assets/` preserving `src/` structure.  
3) The import resolves to a URL string like `/assets/systemComponents/.../file.ext`.  
4) Express serves `dist/assets/` at the `/assets/` URL prefix.  
5) HMR rebuilds on changes.

Diagram
```
src/* → import file → webpack(asset/resource) → dist/assets/* → Express static(/assets/*)
```

When combined with component-scoped features discovery/codegen:
- Feature routes are generated at build time and pages are SSR-rendered.
- Imported assets in those pages resolve to `/assets/...` served by Express.
- No runtime filesystem scanning is used; both route registration and asset URLs are known at build time.

## Configuration

### 1. Webpack Configuration (`webpack-hmr.config.js`)

```javascript
module.exports = function (options, webpack) {
  return {
    ...options,
    output: {
      ...options.output,
      publicPath: '/',  // Root URL for all assets
    },
    module: {
      rules: [
        // Images and SVG
        {
          test: /\.(svg|png|jpe?g|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: (pathData) => {
              // Preserve src/ directory structure
              const match = pathData.filename.match(/src[/\\](.+)/);
              const relativePath = match ? match[1] : path.basename(pathData.filename);
              return `assets/${relativePath}`;  // Output to dist/assets/
            },
          },
        },
        // CSS files
        {
          test: /\.css$/i,
          type: 'asset/resource',
          generator: {
            filename: (pathData) => {
              const match = pathData.filename.match(/src[/\\](.+)/);
              const relativePath = match ? match[1] : path.basename(pathData.filename);
              return `assets/${relativePath}`;
            },
          },
        },
      ],
    },
  };
};
```

**Key configuration:**
- `type: 'asset/resource'` - Copies files (not inline)
- `filename` function - Preserves directory structure from `src/`
- `publicPath: '/'` - Assets resolve to `/assets/...` URLs
- `allowlist` in `nodeExternals` - Allows webpack to process these files

### 2. Express Static Serving (`src/main.ts`)

```typescript
app.useStaticAssets(join(__dirname, "assets"), {
  prefix: "/assets/",
})
```

**This maps:**
- File: `dist/assets/systemComponents/welcome/ui/welcome.svg`
- URL: `/assets/systemComponents/welcome/ui/welcome.svg`

For component-scoped features under `src/components/<feature-id>/ui/*`, the mapping works the same way and results in URLs like `/assets/components/<feature-id>/ui/icon.svg`.

### 3. TypeScript Definitions (`src/types/svg.d.ts`)

```typescript
declare module "*.svg" {
  const content: string  // URL path string
  export default content
}

declare module "*.png" {
  const content: string
  export default content
}

declare module "*.jpg" {
  const content: string
  export default content
}

declare module "*.jpeg" {
  const content: string
  export default content
}

declare module "*.gif" {
  const content: string
  export default content
}

declare module "*.webp" {
  const content: string
  export default content
}

declare module "*.css" {
  const content: string
  export default content
}
```

## Repository Layout

### Source Files

```
src/
├── systemComponents/
│   └── welcome/
│       └── ui/
│           ├── welcome.svg        ← Asset file
│           ├── styles.css         ← CSS file
│           ├── logo.png          ← Image file
│           └── WelcomePage.tsx   ← Imports assets
└── types/
    └── svg.d.ts                  ← Type definitions
```

### Build Output

```
dist/
├── main.js                       ← Compiled bundle (contains URL references)
└── assets/                       ← Copied asset files
    └── systemComponents/
        └── welcome/
      └── ui/
        ├── welcome.svg
        ├── styles.css
        └── logo.png
```

## Benefits

### ✅ Advantages

1. **Type Safety**
   - TypeScript validates all imports at compile time
   - Catch missing files before runtime
   - IDE autocomplete and refactoring support

2. **Separate Files**
   - Smaller bundle size (assets not embedded)
   - Better browser caching (assets cached independently)
   - CDN-ready (can serve from CDN easily)

3. **Hot Module Replacement**
   - Changes to assets trigger automatic rebuild
   - Fast iteration (~500ms rebuild)
   - No manual file copying needed

4. **Consistent Pattern**
   - Same import syntax for all asset types
   - Works for SVG, images, CSS, fonts, etc.
   - Webpack handles all processing

5. **Directory Structure Preserved**
   - Assets maintain their location relative to src/
   - Easy to find files
   - Logical organization

6. **SSR Compatible**
   - Works in Node.js (no browser APIs needed)
   - URLs resolve correctly in server-rendered HTML
   - No runtime file system access required

7. **Pluggable Feature-Friendly**
- Assets live alongside each feature folder and are served uniformly via `/assets/`.
- Generated routes and navigation can reference these URLs without additional configuration.

### Trade-offs

Compared to **data URI embedding**:
- ✅ **Smaller bundle** (assets separate)
- ✅ **Better caching** (independent cache control)
- ⚠️ **Extra HTTP requests** (one per asset)
- ⚠️ **Network latency** (small delay per asset)

When to use this approach:
- ✅ Medium to large assets (>10KB)
- ✅ Many assets (better overall bundle size)
- ✅ Production builds (CDN optimization)
- ✅ Shared assets (reused across pages)

When data URIs might be better:
- Small critical icons (<5KB)
- Single-use assets
- Assets needed for first paint

## Build and Dev Workflow

### Starting Development

```bash
npm run start:dev
```

This will: start webpack in watch mode, copy assets into `dist/assets/`, compile TS, start NestJS with HMR, and auto-rebuild on changes (~500ms).

### Adding New Assets

1. **Place asset file with component:**
   ```
   src/systemComponents/myfeature/ui/
   ├── icon.svg
   ├── background.jpg
   ├── styles.css
   └── MyComponent.tsx
   ```

2. **Import in component:**
   ```tsx
   import icon from "./icon.svg"
   import background from "./background.jpg"
   import styles from "./styles.css"
   
   export function MyComponent() {
     return (
       <div>
         <link rel="stylesheet" href={styles} />
         <div style={{ backgroundImage: `url(${background})` }}>
           <img src={icon} alt="Icon" />
         </div>
       </div>
     )
   }
   ```

3. Save and test: webpack copies files, server picks up new imports, assets available at `/assets/...`.



## Maintenance Notes

1. **Co-locate assets** - Keep files next to systemComponents that use them
   ```
   src/systemComponents/feature/ui/
   ├── component.tsx
   ├── icon.svg
   └── styles.css
   ```

2. Use semantic names (e.g., `user-profile-icon.svg`, `hero-background.jpg`).
3. Keep asset imports only from `src/` so the generator preserves structure.
4. If changing the assets URL prefix, update both webpack `publicPath` and Express `prefix` consistently.
5. For CDN hosting, serve `dist/assets/` from the CDN and set `publicPath` accordingly.


## Summary

Key Files:
- `webpack-hmr.config.js` - Asset handling rules
- `src/types/svg.d.ts` - Type definitions
- `src/main.ts` - Static file serving
- `dist/assets/` - Copied asset files

**Development Workflow:**
```bash
npm run start:dev  # Start with hot reload
# Edit assets → Auto-rebuild → Changes live
```

This approach balances DX, performance, and maintainability. 🚀
