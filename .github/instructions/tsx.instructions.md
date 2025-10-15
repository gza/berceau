---
description: TSX good practices
applyTo: **/*.tsx
---

JSX are rendered on the server side with `import { renderToString } from "react-dom/server"`, so follow these rules:

- Export a `Props` interface (or similarly named interface) for every React component and use it in
	the component signature.
- Use double quotes for JSX attributes.
- Define prop types for all React components.
- Prefer styled-components or CSS modules. When inline styles are unavoidable, keep them minimal.
- Avoid inline styles; use styled-components or CSS modules instead.
- Avoid browser-only APIs (`window`, `document`, `localStorage`, etc.).
- Keep `entry-server.tsx` and any SSR modules free of side effects. Do not import Nest bootstrap
	code or mutate singletons during module evaluation.
- Do not store per-request state in module scope. Pass request data through props, context, or other
	request-scoped containers.

## Asset Handling

- **Asset imports**: Import asset files (SVG, PNG, JPG, CSS) directly using webpack. The build system copies them to separate files:
	```tsx
	import logo from "./logo.svg"
	import photo from "./photo.jpg"
	import styles from "./styles.css"
	
	export function Component() {
		return (
			<div>
				<link rel="stylesheet" href={styles} />
				<img src={logo} alt="Logo" />
				<img src={photo} alt="Photo" />
			</div>
		)
	}
	```
- **Asset files** should be co-located with the component that uses them.
- **Type safety**: TypeScript definitions in `src/types/svg.d.ts` ensure compile-time validation.
- **File copying**: Webpack copies assets to `dist/assets/` preserving directory structure.
- **Separate files**: Assets are served as separate files (not data URIs), better for caching and bundle size.
- **Alternative for small icons**: Inline SVG code directly in JSX for simple icons:
	```tsx
	<svg width="24" height="24" viewBox="0 0 24 24">
		<path d="..." fill="currentColor" />
	</svg>
	```
- **Do not** use hard-coded URLs or runtime path helpers like `getAssetUrl()` - webpack handles all asset imports at build time.
