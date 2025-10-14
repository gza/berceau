# UI Assets Management Guide

Assets (SVG, PNG, JPG, GIF, WebP, CSS) are imported directly. Webpack copies them to `dist/assets/` preserving folder structure. You get back a URL string to use in JSX.

## Quick Start (one CSS + one SVG + one PNG)

```tsx
// src/components/feature/ui/MyComponent.tsx
import styles from "./styles.css"
import icon from "./icon.svg"
import logo from "./logo.png"

export function MyComponent() {
  return (
    <div>
      <link rel="stylesheet" href={styles} />
      <img src={icon} alt="Icon" />
      <img src={logo} alt="Logo" />
    </div>
  )
}
```

Result:
- `styles` → `/assets/components/.../styles.css`
- `icon` → `/assets/components/.../icon.svg`
- `logo` → `/assets/components/.../logo.png`

## Supported Types

| Type | Extensions | Use |
|------|------------|-----|
| Images | `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | `<img src={url} />` |
| Styles | `.css` | `<link rel="stylesheet" href={styles} />` |

## Common Recipes

- Multiple assets
  ```tsx
  import a from "./a.svg";
  import b from "./b.png";
  <>
    <img src={a} />
    <img src={b} />
  </>
  ```

- Background image
  ```tsx
  import bg from "./background.jpg";
  <div style={{ backgroundImage: `url(${bg})` }} />
  ```

- Inline tiny SVG (<500B)
  ```tsx
  <svg width="16" height="16" viewBox="0 0 16 16"><path d="..."/></svg>
  ```

## Troubleshooting

- 404 not found: confirm file exists in `src/`, import path is relative, and rebuild if needed.
- TS cannot find module `*.svg`: ensure `src/types/svg.d.ts` contains module declarations.
- Wrong URL: check Express static setup in `src/main.ts` uses `/assets/` prefix.

## Learn More

- Implementation details: see [UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md](./UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md)
- HMR specifics: [HOT_RELOAD_IMPLEMENTATION.md](./HOT_RELOAD_IMPLEMENTATION.md)

## Development

```bash
npm run start:dev
```

Starts the dev server with HMR:
- Webpack watches asset imports and copies files to `dist/assets/`
- TypeScript recompiles TS/TSX
- Express serves assets at `/assets/`
- Saving changes triggers fast rebuilds (~500ms)
