# Assets Guide - Webpack File Copying Approach

## Overview

Assets (SVG, PNG, JPG, GIF, WebP, CSS) are handled using **webpack with file copying**. This approach combines the benefits of webpack's type-safe imports with separate asset files for better caching and smaller bundles.

## How It Works

### The Approach

1. **Import assets in components** - Use standard ES6 imports
2. **Webpack copies files** - Assets are copied to `dist/assets/` preserving directory structure
3. **TypeScript validates** - Compile-time type checking for all imports
4. **Express serves** - Static files served from `/assets/` URL
5. **Hot reload** - File changes trigger automatic rebuild

### Architecture

```
Source Code (src/)
    ↓
Import: import logo from "./logo.svg"
    ↓
webpack (webpack-hmr.config.js)
    ├── Detects asset import (.svg, .png, .jpg, .css, etc.)
    ├── Copies file to dist/assets/ (preserving src/ structure)
    └── Replaces import with URL string: "/assets/components/.../logo.svg"
    ↓
Compiled Bundle (dist/main.js)
    └── Contains URL references to assets
    ↓
Static Files (dist/assets/)
    └── Actual asset files copied here
    ↓
Express Static Middleware
    └── Serves files from dist/assets/ at /assets/ URL
```

## Usage

### SVG Files

```tsx
// src/components/welcome/ui/WelcomePage.tsx
import welcomeSvg from "./welcome.svg"

export function WelcomePage() {
  return (
    <div>
      <img src={welcomeSvg} alt="Welcome" />
      {/* welcomeSvg is "/assets/components/welcome/ui/welcome.svg" */}
    </div>
  )
}
```

### Images (PNG, JPG, GIF, WebP)

```tsx
import logo from "./logo.png"
import photo from "./photo.jpg"
import icon from "./icon.gif"
import banner from "./banner.webp"

export function Gallery() {
  return (
    <div>
      <img src={logo} alt="Logo" />
      <img src={photo} alt="Photo" />
      <img src={icon} alt="Icon" />
      <img src={banner} alt="Banner" />
    </div>
  )
}
```

### CSS Files

```tsx
import styles from "./styles.css"

export function StyledComponent() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      {/* styles is "/assets/components/.../styles.css" */}
      <div className="my-class">Styled content</div>
    </div>
  )
}
```

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
- File: `dist/assets/components/welcome/ui/welcome.svg`
- URL: `/assets/components/welcome/ui/welcome.svg`

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

## File Structure

### Source Files

```
src/
├── components/
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
    └── components/
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

### ⚠️ Trade-offs

Compared to **data URI embedding**:
- ✅ **Smaller bundle** (assets separate)
- ✅ **Better caching** (independent cache control)
- ⚠️ **Extra HTTP requests** (one per asset)
- ⚠️ **Network latency** (small delay per asset)

**When to use this approach:**
- ✅ Medium to large assets (>10KB)
- ✅ Many assets (better overall bundle size)
- ✅ Production builds (CDN optimization)
- ✅ Shared assets (reused across pages)

**When data URIs might be better:**
- Small critical icons (<5KB)
- Single-use assets
- Assets needed for first paint

## Development Workflow

### Starting Development

```bash
npm run start:dev
```

This will:
1. Start webpack in watch mode
2. Copy assets to `dist/assets/`
3. Compile TypeScript
4. Start NestJS server with HMR
5. Watch for file changes
6. Auto-rebuild on changes (~500ms)

### Adding New Assets

1. **Place asset file with component:**
   ```
   src/components/myfeature/ui/
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

3. **Save and test:**
   - Webpack automatically copies files
   - Server restarts with new imports
   - Assets accessible at `/assets/...` URLs

### Hot Reload Behavior

**What triggers rebuild:**
- Adding new asset files
- Modifying existing assets
- Changing component imports
- TypeScript/TSX file changes

**Build performance:**
- First build: ~1900ms
- Incremental rebuild: ~500ms
- Asset copy: <50ms per file

## Alternative Approaches

### Option 1: Inline SVG in JSX

For small, simple icons:

```tsx
export function Icon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10l10 5 10-5V7z" fill="currentColor" />
    </svg>
  )
}
```

**Best for:**
- Tiny icons (<500 bytes)
- Single-color icons
- Icons needing dynamic colors

### Option 2: Manual Static Files (Not Recommended)

Using `getAssetUrl()` helper:

```tsx
import { getAssetUrl } from "../../../utils/assets"

<img src={getAssetUrl("components/welcome/ui/welcome.svg")} />
```

**Drawbacks:**
- ❌ No type safety
- ❌ No compile-time validation
- ❌ Manual path management
- ❌ Runtime 404 errors

### Option 3: Data URI Embedding

Change webpack config to use `asset/inline`:

```javascript
{
  test: /\.svg$/,
  type: 'asset/inline',  // Embed as data URI
}
```

**Trade-offs:**
- ✅ No HTTP requests
- ⚠️ Larger bundle size
- ⚠️ No independent caching

## Troubleshooting

### Asset Not Found (404)

**Symptoms:** Browser shows 404 for `/assets/...` URL

**Solutions:**
1. Check file exists in `src/`:
   ```bash
   ls -la src/components/welcome/ui/welcome.svg
   ```

2. Verify import path is correct:
   ```tsx
   import logo from "./logo.svg"  // ✅ Correct
   import logo from "../logo.svg" // ❌ Wrong path
   ```

3. Check dist folder:
   ```bash
   ls -la dist/assets/components/welcome/ui/
   ```

4. Rebuild:
   ```bash
   rm -rf dist && npm run build
   ```

### TypeScript Import Error

**Error:** `Cannot find module './logo.svg'`

**Solution:** Verify `src/types/svg.d.ts` exists and includes:
```typescript
declare module "*.svg" {
  const content: string
  export default content
}
```

### Wrong URL in HTML

**Symptoms:** Image src is incorrect (double path, wrong prefix, etc.)

**Debug:**
```bash
# Check rendered HTML
curl http://localhost:3000/ | grep "<img"

# Check actual file location
find dist/assets -name "*.svg"
```

**Common issues:**
- `publicPath` misconfigured in webpack
- Express static middleware path wrong
- Filename generator not extracting path correctly

### Assets Not Copying

**Symptoms:** Files missing from `dist/assets/`

**Solutions:**
1. Check webpack allowlist:
   ```javascript
   allowlist: ['webpack/hot/poll?100', /\.(svg|png|jpe?g|gif|webp|css)$/i]
   ```

2. Verify file extension matches regex

3. Clean rebuild:
   ```bash
   rm -rf dist node_modules/.cache
   npm run build
   ```

## Best Practices

1. **Co-locate assets** - Keep files next to components that use them
   ```
   src/components/feature/ui/
   ├── component.tsx
   ├── icon.svg
   └── styles.css
   ```

2. **Use semantic names**
   - ✅ `user-profile-icon.svg`, `hero-background.jpg`
   - ❌ `image1.svg`, `pic.jpg`

3. **Optimize before committing**
   ```bash
   # Optimize SVG
   npx svgo src/components/*/ui/*.svg
   
   # Optimize images
   npx imagemin src/**/*.{png,jpg} --out-dir=src
   ```

4. **Always add alt text**
   ```tsx
   <img src={logo} alt="Company logo" />  ✅
   <img src={logo} />                      ❌
   ```

5. **Group related assets**
   ```
   ui/
   ├── assets/
   │   ├── icons/
   │   ├── images/
   │   └── styles/
   └── components/
   ```

6. **Use appropriate formats**
   - **SVG**: Logos, icons, simple illustrations
   - **PNG**: Screenshots, graphics with transparency
   - **JPG**: Photos, complex images
   - **WebP**: Modern format (smaller, good quality)
   - **CSS**: Component-specific styles

## Summary

**Current Implementation:**
- ✅ Webpack copies assets to `dist/assets/`
- ✅ Type-safe imports with TypeScript
- ✅ Hot reload with fast rebuilds (~500ms)
- ✅ Separate files for better caching
- ✅ Works with SVG, PNG, JPG, CSS, etc.
- ✅ SSR compatible

**Key Files:**
- `webpack-hmr.config.js` - Asset handling rules
- `src/types/svg.d.ts` - Type definitions
- `src/main.ts` - Static file serving
- `dist/assets/` - Copied asset files

**Development Workflow:**
```bash
npm run start:dev  # Start with hot reload
# Edit assets → Auto-rebuild → Changes live
```

This approach provides the best balance of developer experience, performance, and maintainability! 🚀
