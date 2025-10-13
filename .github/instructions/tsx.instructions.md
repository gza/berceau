---
description: TSX good practices
applyTo: **/*.tsx
---

JSX are rendered on the server side, so follow these rules:

- Export a `Props` interface (or similarly named interface) for every React component and use it in
	the component signature.
- Use double quotes for JSX attributes.
- Prefer styled-components or CSS modules. When inline styles are unavoidable, keep them minimal.
- Avoid browser-only APIs (`window`, `document`, `localStorage`, etc.).
- Keep `entry-server.tsx` and any SSR modules free of side effects. Do not import Nest bootstrap
	code or mutate singletons during module evaluation.
- Do not store per-request state in module scope. Pass request data through props, context, or other
	request-scoped containers.
- Resolve static assets through Vite-aware helpers such as `new URL("./asset.svg", import.meta.url)`
	or the generated manifest. Avoid hard-coded `/public` URLs inside JSX.
- Use double quotes for JSX attributes.
- Define prop types for all React components.
- Avoid inline styles; use styled-components or CSS modules instead.
