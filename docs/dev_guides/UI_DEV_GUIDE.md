# UI Development Guide

This guide covers the essentials of UI development. 

## Introduction

The UI is server-side rendered (SSR). Like PHP, Django, Ruby on Rails, etc.. the HTML is generated on the server and sent as a full document to the client.

We use TSX/JSX as HTML templating engine. This provides a type-safe way to build UI components and allow a lot of IDE helpers to assist with the development process. The JSX is rendered by an engine (part of React) on the server.

> ⚠️ Remember that this is not really React in the traditional SPA sense. There is no client-side React runtime by default. The server renders full HTML documents which are sent to the client. 

### Detailed implementation docs

For curious developers and maintainers, see how this is implemented:

- Implementation details: see [UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md](../implementation_doc/UI_ASSETS_MANAGEMENT_IMPLEMENTATION.md)
- HMR specifics: [HOT_RELOAD_IMPLEMENTATION.md](../implementation_doc/HOT_RELOAD_IMPLEMENTATION.md)


## Quick Start

```tsx
// src/components/demo/ui/MyIcon.tsx

import icon from "./info.svg"

// Client-side script.
// React engine will ignore 'onclick' directly in JSX because this is meant to be used in the browser.
// The solution is to inject a <script> block that will run in the browser.
const clientScript = (message) => {
  return `
    document.querySelector('#icon').addEventListener('click', (event) => {
     alert('this is your message ${message}');
    });
  `
}

export function MyIcon({ message }: { message: string }) {
  return (
    <div>
      <img src={icon} id="icon" alt="Icon" />
      <script>{clientScript(message)}</script>
      {/* ℹ️ Note: This has to be after the elements you want to interact with */}
    </div>
  )
}

// src/components/demo/ui/DemoPage.tsx

import logo from "./logo.png"
import styles from "./styles.css"
import { MyIcon } from "./MyIcon"

export function DemoPage() {
  return (
    <div className="demo-page">
      <link rel="stylesheet" href={styles} />
      <img src={logo} id="logo" alt="Logo" />
      <h1>My Icon !</h1>
      <MyIcon message="Hello from the Demo Page!" />
    </div>
  )
}

```

Result:
- `styles` → `/assets/components/.../styles.css`
- `icon` → `/assets/components/.../icon.svg`
- `logo` → `/assets/components/.../logo.png`

Tip: In component-scoped components under `src/components/<component-id>/`, co-locate UI assets (SVG, images, CSS) next to the TSX files. They will be copied to `/assets/components/<component-id>/...` and URLs will be stable across SSR and client requests.

## Assets Management

Assets (SVG, PNG, JPG, GIF, WebP, CSS) are imported directly. Webpack copies them to `dist/assets/` preserving folder structure. You get back a URL string to use in JSX.

### Supported Types

| Type | Extensions | Use |
|------|------------|-----|
| Images | `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | `<img src={url} />` |
| Styles | `.css` | `<link rel="stylesheet" href={styles} />` |

## Forms

Forms are supported as normal HTML forms. Since this is server-side rendered, the form submission will reload the page.

### CSRF Protection

Forms should include a CSRF token for protection against CSRF attacks. Use the `CsrfToken` component to include the token in your forms.

```tsx
import { CsrfToken } from "src/csrf/csrf-token.component"

export function PostForm() {
  return (
    <form method="POST" action="/submit-post">
      <CsrfToken />
      <input type="text" name="title" placeholder="Post Title" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Patterns that won't work

### ❌️ Inline Event Handlers like `onclick`

```tsx
export function MyComponent() {
  return (
    <div>
      <button onclick={() => alert('Clicked!')}>Click Me</button>
    </div>
  )
}
```
This will not work because React ignores `onclick` attributes during server-side rendering. Instead, use a client-side script injection as shown in the Quick Start section.

### ❌️ Use of React State or Effects

Since there is no client-side React runtime by default, using React state (`useState`) or effects (`useEffect`) will not work as expected. All interactivity must be handled through client-side scripts injected into the page.
