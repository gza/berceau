# JSX Component Contract: <CsrfToken />

**Feature**: 003-provide-an-easy  
**Date**: 2025-10-24  
**Type**: Server-Side Rendered JSX Component

## Overview

The `<CsrfToken />` component is a server-side JSX component that renders a hidden HTML input field containing a CSRF token. It integrates seamlessly with the existing SSR pipeline and requires no client-side JavaScript.

## Component Signature

```tsx
function CsrfToken(props?: CsrfTokenProps): JSX.Element
```

## Props Interface

```typescript
interface CsrfTokenProps {
  /**
   * Custom field name for the hidden input
   * @default '_csrf' (from configuration)
   */
  fieldName?: string;

  /**
   * HTML id attribute for the input element
   * @optional
   */
  id?: string;

  /**
   * data-testid attribute for testing
   * @optional
   * @default 'csrf-token'
   */
  'data-testid'?: string;
}
```

## Rendered Output

### Standard Usage

**Input**:
```tsx
<form method="POST" action="/submit">
  <CsrfToken />
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

**Rendered HTML**:
```html
<form method="POST" action="/submit">
  <input
    type="hidden"
    name="_csrf"
    value="a3f8d9e2b1c4567890abcdef12345678fedcba0987654321abcdef1234567890"
    data-testid="csrf-token"
  />
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### Custom Field Name

**Input**:
```tsx
<CsrfToken fieldName="csrf_token" />
```

**Rendered HTML**:
```html
<input
  type="hidden"
  name="csrf_token"
  value="a3f8d9e2b1c4567890abcdef12345678fedcba0987654321abcdef1234567890"
  data-testid="csrf-token"
/>
```

### With Custom ID

**Input**:
```tsx
<CsrfToken id="my-csrf" />
```

**Rendered HTML**:
```html
<input
  type="hidden"
  name="_csrf"
  id="my-csrf"
  value="a3f8d9e2b1c4567890abcdef12345678fedcba0987654321abcdef1234567890"
  data-testid="csrf-token"
/>
```

## Usage Examples

### Basic Form Protection

```tsx
import { CsrfToken } from '@/csrf/csrf-token.component';

export function ContactForm() {
  return (
    <form method="POST" action="/contact">
      <CsrfToken />
      
      <label htmlFor="name">Name</label>
      <input type="text" id="name" name="name" required />
      
      <label htmlFor="email">Email</label>
      <input type="email" id="email" name="email" required />
      
      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" required></textarea>
      
      <button type="submit">Send Message</button>
    </form>
  );
}
```

### Multiple Forms on Same Page

```tsx
import { CsrfToken } from '@/csrf/csrf-token.component';

export function AccountPage() {
  return (
    <div>
      {/* Profile update form */}
      <form method="POST" action="/profile/update">
        <CsrfToken id="profile-csrf" />
        <input type="text" name="displayName" />
        <button type="submit">Update Profile</button>
      </form>

      {/* Password change form */}
      <form method="POST" action="/password/change">
        <CsrfToken id="password-csrf" />
        <input type="password" name="currentPassword" />
        <input type="password" name="newPassword" />
        <button type="submit">Change Password</button>
      </form>

      {/* Delete account form */}
      <form method="POST" action="/account/delete">
        <CsrfToken id="delete-csrf" />
        <button type="submit" className="danger">Delete Account</button>
      </form>
    </div>
  );
}

// Note: All forms share the same session token value, but have unique IDs
```

### Form with AJAX Submission

For forms that will be submitted via JavaScript, the token can be accessed from the hidden input:

```tsx
import { CsrfToken } from '@/csrf/csrf-token.component';

export function AjaxForm() {
  return (
    <form id="ajaxForm" onSubmit="handleSubmit(event)">
      <CsrfToken />
      <input type="text" name="data" />
      <button type="submit">Submit</button>
    </form>
  );
}

// Client-side JavaScript (separate file):
// function handleSubmit(event) {
//   event.preventDefault();
//   const form = event.target;
//   const formData = new FormData(form);
//   const token = formData.get('_csrf');
//   
//   fetch(form.action, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'X-CSRF-Token': token
//     },
//     body: JSON.stringify(Object.fromEntries(formData))
//   });
// }
```

### DELETE Form (Non-Standard Method)

HTML forms only support GET and POST, so DELETE must be handled via POST with method override:

```tsx
import { CsrfToken } from '@/csrf/csrf-token.component';

export function DeleteButton({ itemId }: { itemId: string }) {
  return (
    <form method="POST" action={`/items/${itemId}/delete`}>
      <CsrfToken />
      <button 
        type="submit" 
        className="btn-danger"
        onClick="return confirm('Are you sure?')"
      >
        Delete Item
      </button>
    </form>
  );
}

// Controller handles POST /items/:id/delete
// Alternatively, use method override middleware and <input type="hidden" name="_method" value="DELETE" />
```

## Implementation Contract

### Token Injection

The component MUST obtain the CSRF token from the current request context. Implementation strategies:

**Option 1: Request-Scoped Provider**
```typescript
@Injectable({ scope: Scope.REQUEST })
export class CsrfContextService {
  constructor(@Inject(REQUEST) private request: any) {}
  
  getToken(): string {
    return this.request.session._csrf || '';
  }
}

// Component uses dependency injection
export function CsrfToken(props: CsrfTokenProps): JSX.Element {
  const csrfContext = useCsrfContext(); // DI mechanism
  const token = csrfContext.getToken();
  // ...
}
```

**Option 2: AsyncLocalStorage Pattern**
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const csrfContext = new AsyncLocalStorage<CsrfRenderContext>();

// In renderPage():
csrfContext.run({ csrfToken, csrfFieldName }, () => {
  // Render component tree
});

// In component:
export function CsrfToken(props: CsrfTokenProps): JSX.Element {
  const context = csrfContext.getStore();
  const token = context?.csrfToken || '';
  // ...
}
```

**Option 3: Context Props Pattern**
```typescript
// Modified renderPage signature:
export function renderPage(
  content: ReactElement,
  options: RenderPageOptions,
  request: Request // Add request parameter
): string {
  const csrfToken = csrfService.getToken(request.session);
  
  // Wrap content with context provider
  const view = renderToString(
    <CsrfContext.Provider value={{ token: csrfToken }}>
      <HtmlDocument {...options}>
        <AppLayout>{content}</AppLayout>
      </HtmlDocument>
    </CsrfContext.Provider>
  );
  
  return `<!DOCTYPE html>${view}`;
}

// Component uses React Context (server-side)
export function CsrfToken(props: CsrfTokenProps): JSX.Element {
  const { token } = useContext(CsrfContext);
  // ...
}
```

### Token Generation Timing

- Token MUST be generated lazily (only when `<CsrfToken />` is rendered)
- Token MUST be cached in session (don't regenerate on every render)
- Token MUST remain valid for entire session lifetime

### Security Requirements

1. **No Client-Side Generation**: Token MUST be generated server-side
2. **No Token Leakage**: Token MUST NOT appear in:
   - URLs (query parameters)
   - JavaScript global variables
   - Cookie values (except session cookie)
   - Log files
3. **Constant Value Per Session**: All `<CsrfToken />` instances in same session MUST render same token value
4. **Automatic Expiration**: Token MUST expire when session expires

## Testing Contract

### Unit Tests

```typescript
describe('CsrfToken Component', () => {
  it('should render hidden input with token', () => {
    const { container } = render(<CsrfToken />, {
      csrfContext: { token: 'test-token' }
    });
    
    const input = container.querySelector('input[type="hidden"]');
    expect(input).toBeDefined();
    expect(input?.getAttribute('name')).toBe('_csrf');
    expect(input?.getAttribute('value')).toBe('test-token');
  });

  it('should use custom field name', () => {
    const { container } = render(
      <CsrfToken fieldName="custom_csrf" />,
      { csrfContext: { token: 'test-token' } }
    );
    
    const input = container.querySelector('input[name="custom_csrf"]');
    expect(input).toBeDefined();
  });

  it('should include id attribute', () => {
    const { container } = render(
      <CsrfToken id="my-token" />,
      { csrfContext: { token: 'test-token' } }
    );
    
    const input = container.querySelector('#my-token');
    expect(input).toBeDefined();
  });

  it('should handle missing token gracefully', () => {
    const { container } = render(<CsrfToken />, {
      csrfContext: { token: '' }
    });
    
    const input = container.querySelector('input[type="hidden"]');
    expect(input?.getAttribute('value')).toBe('');
  });
});
```

### Integration Tests

```typescript
describe('CsrfToken Integration', () => {
  it('should inject token into SSR page', async () => {
    const response = await request(app.getHttpServer())
      .get('/form-page')
      .expect(200);
    
    // Extract token from HTML
    const tokenMatch = response.text.match(
      /name="_csrf" value="([a-f0-9]{64})"/
    );
    expect(tokenMatch).toBeDefined();
    expect(tokenMatch[1]).toHaveLength(64);
  });

  it('should use same token for multiple components', async () => {
    const response = await request(app.getHttpServer())
      .get('/multiple-forms')
      .expect(200);
    
    // Extract all tokens
    const tokens = [
      ...response.text.matchAll(/name="_csrf" value="([a-f0-9]{64})"/g)
    ].map(match => match[1]);
    
    // All tokens should be identical
    expect(tokens.length).toBeGreaterThan(1);
    expect(new Set(tokens).size).toBe(1);
  });
});
```

## Meta Tag Alternative

For programmatic access (testing, AJAX), also inject token into meta tag:

```tsx
// In HtmlDocument component:
export function HtmlDocument({ csrf, ...props }) {
  return (
    <html>
      <head>
        {csrf && (
          <>
            <meta name="csrf-token" content={csrf.csrfToken} />
            <meta name="csrf-param" content={csrf.csrfFieldName} />
          </>
        )}
        {/* ... other head elements */}
      </head>
      <body>{props.children}</body>
    </html>
  );
}
```

Client-side access:

```javascript
// Utility function
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || '';
}

// Usage in fetch
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCsrfToken()
  },
  body: JSON.stringify(data)
});
```

## Error Handling

### Missing Token Context

If component is rendered without CSRF context:

```typescript
export function CsrfToken(props: CsrfTokenProps): JSX.Element {
  const context = useCsrfContext();
  
  if (!context || !context.token) {
    // Development: Throw error to alert developer
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        '<CsrfToken /> rendered without CSRF context. ' +
        'Ensure CsrfModule is imported and renderPage provides context.'
      );
    }
    
    // Production: Log warning and render empty input
    console.warn('<CsrfToken /> missing context, rendering empty token');
    return <input type="hidden" name={props.fieldName || '_csrf'} value="" />;
  }
  
  // Normal rendering...
}
```

## Performance Considerations

- **Zero Client-Side Cost**: Component renders to static HTML, no JavaScript required
- **Minimal Server Cost**: Token generation ~0.1ms, rendering ~0.01ms
- **Single Generation Per Session**: Token generated once and reused
- **No Re-renders**: Server-side component doesn't re-render after initial page load

## Accessibility

The component renders a hidden input which:
- Is NOT announced by screen readers (type="hidden")
- Does NOT affect tab order
- Does NOT require ARIA attributes
- Has NO accessibility impact

## Browser Compatibility

Component output is standard HTML5, compatible with:
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Internet Explorer 11+
- Mobile browsers (iOS Safari, Chrome Mobile)

No polyfills or special handling required.

## Migration Path

For existing forms without CSRF protection:

1. Import component: `import { CsrfToken } from '@/csrf/csrf-token.component';`
2. Add to form: Insert `<CsrfToken />` as first child of `<form>`
3. Test submission: Verify form still works
4. Deploy: No client-side changes needed

**Example Migration**:

**Before**:
```tsx
<form method="POST" action="/submit">
  <input type="text" name="data" />
  <button type="submit">Submit</button>
</form>
```

**After**:
```tsx
<form method="POST" action="/submit">
  <CsrfToken />  {/* <-- Only change needed */}
  <input type="text" name="data" />
  <button type="submit">Submit</button>
</form>
```

## Summary

The `<CsrfToken />` component provides:
- ✅ **Simple API**: Single import, single tag
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Zero Client Cost**: Pure SSR, no JavaScript required
- ✅ **Automatic**: Token generation and injection handled transparently
- ✅ **Secure**: Follows OWASP best practices
- ✅ **Testable**: Easy to test with standard tools
- ✅ **Compatible**: Works with existing forms without changes
