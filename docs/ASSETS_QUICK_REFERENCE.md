# Quick Reference: Asset Handling

## Summary

Assets (SVG, PNG, JPG, GIF, WebP, CSS) are handled using **webpack with file copying**. Import any asset directly, and webpack copies it to `dist/assets/` preserving your directory structure.

## Quick Start

```tsx
// Import assets
import logo from "./logo.svg"
import photo from "./photo.jpg"
import styles from "./styles.css"

// Use in component
export function MyComponent() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      <img src={logo} alt="Logo" />
      <img src={photo} alt="Photo" />
    </div>
  )
}
```

**Result:**
- `logo` is `"/assets/components/.../logo.svg"`
- Files copied to `dist/assets/...`
- Served by Express at `/assets/...` URL
- Type-safe with TypeScript
- Hot reload enabled

## Supported File Types

| Type | Extensions | Example Usage |
|------|-----------|---------------|
| **Images** | `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | `<img src={icon} />` |
| **Styles** | `.css` | `<link rel="stylesheet" href={styles} />` |

## File Structure

```
src/components/feature/ui/
├── MyComponent.tsx    → import logo from "./logo.svg"
├── logo.svg          → Copied to dist/assets/components/feature/ui/logo.svg
├── photo.jpg         → Copied to dist/assets/components/feature/ui/photo.jpg
└── styles.css        → Copied to dist/assets/components/feature/ui/styles.css
```

## How It Works

1. **Import** assets with standard ES6 imports
2. **Webpack** detects imports and copies files to `dist/assets/`
3. **TypeScript** validates imports at compile time
4. **Express** serves files from `/assets/` URL
5. **HMR** triggers rebuild on asset changes (~500ms)

## Common Tasks

### Add New Asset

1. Place file next to component
2. Import in component: `import icon from "./icon.svg"`
3. Use in JSX: `<img src={icon} alt="Icon" />`
4. Save - webpack automatically copies and rebuilds

### Multiple Assets

```tsx
import icon1 from "./icon1.svg"
import icon2 from "./icon2.svg"
import bg from "./background.jpg"

<div style={{ backgroundImage: `url(${bg})` }}>
  <img src={icon1} />
  <img src={icon2} />
</div>
```

### Inline Small SVG

For tiny icons (<500 bytes):

```tsx
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="..." fill="currentColor" />
</svg>
```

## Benefits

- ✅ **Type-safe** - Compile-time validation
- ✅ **Separate files** - Better caching, smaller bundle
- ✅ **Hot reload** - Fast iteration (~500ms)
- ✅ **Consistent** - Same pattern for all assets
- ✅ **SSR compatible** - Works in Node.js

## Troubleshooting

### Asset Not Found (404)

1. Check file exists in `src/`
2. Verify import path: `import logo from "./logo.svg"`
3. Rebuild: `rm -rf dist && npm run build`

### TypeScript Error

Ensure `src/types/svg.d.ts` exists:
```typescript
declare module "*.svg" {
  const content: string
  export default content
}
```

### Wrong URL

Check Express static middleware in `src/main.ts`:
```typescript
app.useStaticAssets(join(__dirname, "assets"), {
  prefix: "/assets/",
})
```

## Documentation

For complete details, see:
- **[ASSETS_GUIDE.md](./ASSETS_GUIDE.md)** - Comprehensive documentation
- **[GENERAL_ARCHITECTURE.md](./GENERAL_ARCHITECTURE.md)** - Project architecture
- **[HOT_RELOAD_IMPLEMENTATION.md](./HOT_RELOAD_IMPLEMENTATION.md)** - HMR details

## Development

```bash
npm run start:dev  # Start dev server with hot reload
# Edit assets → Auto-rebuild → Changes live (~500ms)
```

---

**Last Updated**: October 2025  
**Approach**: Webpack file copying (not data URI embedding)
