# CSRF Protection Developer Guide

**Last Updated**: 2025-10-26  
**Feature**: CSRF Token Protection for UI Forms  
**Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Setup Instructions](#setup-instructions)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)
8. [Performance](#performance)

---

## Overview

This guide covers how to implement CSRF (Cross-Site Request Forgery) protection in your NestJS application using the built-in CSRF protection module. The implementation follows OWASP best practices and the Synchronizer Token Pattern.

### What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack that forces users to execute unwanted actions on a web application where they're authenticated. For example, an attacker could trick a user into submitting a form that transfers money or changes their password.

### How Our Protection Works

1. **Token Generation**: Server generates a cryptographically secure token per user session
2. **Token Embedding**: Token is embedded in forms as a hidden input field
3. **Token Validation**: Server validates token on all state-changing requests (POST, PUT, DELETE, PATCH)
4. **Automatic Protection**: Global guard automatically protects all endpoints (with opt-out available for APIs)

---

## Quick Start

**Time to Complete**: ~5 minutes

### 1. Verify Session Middleware

The CSRF module requires `express-session`. Check if it's configured in `src/main.ts`:

```typescript
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

**✅ Already configured** in this project.

### 2. Import CsrfModule

The module is already imported globally in `src/app.module.ts`:

```typescript
import { CsrfModule } from './csrf/csrf.module';

@Module({
  imports: [
    CsrfModule.forRoot(),
    // ... other modules
  ],
})
export class AppModule {}
```

**✅ Already configured** - CSRF protection is globally enabled.

### 3. Protect Your Forms

Import and use the `<CsrfToken />` component in your forms:

```tsx
import { CsrfToken } from '../../../csrf';

export function MyForm() {
  return (
    <form method="POST" action="/submit">
      <CsrfToken />
      
      <input type="text" name="username" placeholder="Username" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**That's it!** Your form is now protected against CSRF attacks.

---

## Setup Instructions

### Prerequisites

- NestJS 11.1.6+
- Node.js 18+
- Express session middleware configured
- Server-side rendering with React/JSX

### Environment Variables

Add these to your `.env` file:

```bash
# Required: Session secret for cryptographic operations
SESSION_SECRET=your-cryptographically-secure-random-string

# Optional: Node environment
NODE_ENV=development  # or 'production'
```

**Generate a secure secret**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Production Considerations

For production deployments:

1. **Use a persistent session store** (Redis, PostgreSQL, etc.):

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,  // HTTPS only
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

2. **Enable HTTPS**: Set `cookie.secure: true` to ensure cookies are only sent over HTTPS

3. **Use SameSite=Strict**: For maximum protection (may affect legitimate cross-origin requests)

---

## Usage Examples

### Basic Form Protection

The simplest case - a single form with CSRF protection:

```tsx
import { CsrfToken } from '../../../csrf';

export function LoginForm() {
  return (
    <form method="POST" action="/auth/login">
      <CsrfToken />
      
      <label>
        Email:
        <input type="email" name="email" required />
      </label>
      
      <label>
        Password:
        <input type="password" name="password" required />
      </label>
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Multiple Forms on One Page

Each form needs its own `<CsrfToken />` component:

```tsx
import { CsrfToken } from '../../../csrf';

export function AccountSettings() {
  return (
    <div>
      <h2>Profile Settings</h2>
      <form method="POST" action="/profile/update">
        <CsrfToken />
        <input type="text" name="displayName" />
        <button type="submit">Update Profile</button>
      </form>

      <h2>Change Password</h2>
      <form method="POST" action="/profile/password">
        <CsrfToken />
        <input type="password" name="currentPassword" />
        <input type="password" name="newPassword" />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}
```

### Custom Field Name and ID

Customize the token field attributes:

```tsx
import { CsrfToken } from '../../../csrf';

export function CustomForm() {
  return (
    <form method="POST" action="/submit">
      <CsrfToken 
        fieldName="customCsrfToken"
        id="my-csrf-token"
        data-testid="csrf-field"
      />
      
      {/* form fields */}
    </form>
  );
}
```

### AJAX/Fetch Requests

For JavaScript-based form submissions, include the token in the request header:

```tsx
import { CsrfToken } from '../../../csrf';

export function AjaxForm() {
  return (
    <form id="ajax-form">
      <CsrfToken />
      <input type="text" name="data" />
      <button type="button" onclick="handleSubmit(event)">Submit</button>
    </form>
  );
}

// In your JavaScript:
// function handleSubmit(event) {
//   event.preventDefault();
//   const form = document.getElementById('ajax-form');
//   const formData = new FormData(form);
//   const csrfToken = formData.get('_csrf');
//   
//   fetch('/api/submit', {
//     method: 'POST',
//     headers: {
//       'X-Csrf-Token': csrfToken,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       data: formData.get('data')
//     })
//   })
//   .then(response => response.json())
//   .then(data => console.log('Success:', data));
// }
```

### API Endpoints (Opt-Out)

For JSON API endpoints that don't handle forms, use `@SkipCsrf()` decorator:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { SkipCsrf } from '../../csrf';

@Controller('api')
export class ApiController {
  // This endpoint skips CSRF validation
  @Post('data')
  @SkipCsrf()
  createData(@Body() data: CreateDataDto) {
    return this.service.create(data);
  }
}
```

**⚠️ CRITICAL SECURITY WARNING**: Endpoints using `@SkipCsrf()` **MUST** implement alternative authentication:

- **Bearer tokens** (JWT, OAuth 2.0)
- **API keys** with proper validation
- **OAuth 2.0** authorization flows
- **Mutual TLS** (mTLS) certificate-based authentication

**Example with JWT authentication**:

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SkipCsrf } from '../../csrf';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
export class ApiController {
  @Post('data')
  @SkipCsrf()
  @UseGuards(JwtAuthGuard)  // ✅ Alternative authentication
  createData(@Body() data: CreateDataDto) {
    return this.service.create(data);
  }
}
```

**Never** use `@SkipCsrf()` without alternative authentication, as this creates a security vulnerability.

### Class-Level Protection Opt-Out

Apply `@SkipCsrf()` to an entire controller:

```typescript
import { Controller, Post, Get } from '@nestjs/common';
import { SkipCsrf } from '../../csrf';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1')
@SkipCsrf()  // All methods in this controller skip CSRF
@UseGuards(JwtAuthGuard)  // But require JWT authentication
export class ApiV1Controller {
  @Post('users')
  createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @Post('posts')
  createPost(@Body() data: CreatePostDto) {
    return this.postService.create(data);
  }
}
```

---

## API Reference

### `<CsrfToken />` Component

JSX component for embedding CSRF tokens in forms.

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fieldName` | `string` | `"_csrf"` | Name attribute of the hidden input field |
| `id` | `string` | `undefined` | ID attribute of the hidden input field |
| `data-testid` | `string` | `"csrf-token"` | Test ID for testing frameworks |

**Returns**: `JSX.Element | null`

Returns a hidden input field with the CSRF token, or `null` if no session is available.

**Example**:

```tsx
<CsrfToken fieldName="custom_token" id="my-token" data-testid="token-field" />
```

Renders:

```html
<input type="hidden" name="custom_token" id="my-token" value="abc123..." data-testid="token-field" />
```

### `@SkipCsrf()` Decorator

Decorator to opt-out of CSRF protection for specific endpoints or controllers.

**Usage**:

```typescript
import { SkipCsrf } from '../../csrf';

// Method-level
@Post('endpoint')
@SkipCsrf()
methodName() { }

// Class-level
@Controller('api')
@SkipCsrf()
class ApiController { }
```

**Security Requirement**: Endpoints using this decorator **MUST** implement alternative authentication mechanisms.

### `CsrfService`

Service for programmatic token access (advanced use cases).

**Methods**:

```typescript
class CsrfService {
  // Generate or retrieve existing token for session
  generateToken(session: SessionData): string
  
  // Get existing token from session
  getToken(session: SessionData): string | undefined
  
  // Get field name for forms
  getFieldName(): string  // Returns "_csrf"
  
  // Get header name for AJAX requests
  getHeaderName(): string  // Returns "X-Csrf-Token"
  
  // Extract token from request (body, header, or query)
  extractTokenFromRequest(request: Request): { value: string; location: string } | undefined
  
  // Validate token against session
  validateToken(session: SessionData, request: Request): CsrfValidationResult
}
```

**Example** (testing):

```typescript
import { Test } from '@nestjs/testing';
import { CsrfService } from './csrf/csrf.service';

const service = app.get(CsrfService);
const session = {} as SessionData;

const token = service.generateToken(session);
console.log('Token:', token);
console.log('Field name:', service.getFieldName());
```

---

## Security Considerations

### What is Protected

✅ **Protected by default**:
- POST requests
- PUT requests
- DELETE requests
- PATCH requests

✅ **Exempt by default** (safe methods):
- GET requests
- HEAD requests
- OPTIONS requests

### Token Storage

- **Server-side**: Tokens are stored in server-side sessions (never in cookies or localStorage)
- **Session-scoped**: Each user session has its own unique token
- **Persistent**: Tokens remain valid for the session lifetime (default: 24 hours)

### Security Best Practices

1. **Always use HTTPS in production**: Set `cookie.secure: true` to prevent token theft over unencrypted connections

2. **Use SameSite cookies**: Already configured as `'lax'` (recommended) or `'strict'` (maximum protection)

3. **Short session lifetimes**: Configure appropriate `maxAge` for your application's security requirements

4. **Secure session secrets**: Use strong, random session secrets (32+ bytes) and store in environment variables

5. **Alternative authentication for APIs**: Never use `@SkipCsrf()` without implementing JWT, OAuth, API keys, or similar authentication

6. **Validate all user inputs**: CSRF protection does NOT protect against XSS, SQL injection, or other vulnerabilities

### Common Security Mistakes

❌ **DON'T**: Store tokens in localStorage or cookies
```typescript
// BAD - Never do this
localStorage.setItem('csrf', token);
document.cookie = `csrf=${token}`;
```

❌ **DON'T**: Skip CSRF protection without alternative authentication
```typescript
// BAD - Creates security vulnerability
@Post('important-action')
@SkipCsrf()  // No alternative auth!
dangerousMethod() { }
```

❌ **DON'T**: Expose tokens in URLs
```html
<!-- BAD - Token visible in browser history/logs -->
<form action="/submit?csrf=abc123" method="POST">
```

✅ **DO**: Use hidden form fields
```html
<!-- GOOD - Token hidden in request body -->
<form method="POST">
  <input type="hidden" name="_csrf" value="abc123" />
</form>
```

### OWASP Compliance

This implementation follows OWASP CSRF Prevention Cheat Sheet recommendations:

- ✅ Synchronizer Token Pattern
- ✅ Cryptographically secure token generation (`crypto.randomBytes(32)`)
- ✅ Server-side token storage (sessions)
- ✅ Constant-time token comparison (`timingSafeEqual`)
- ✅ SameSite cookie attribute
- ✅ Safe methods (GET/HEAD/OPTIONS) exempt
- ✅ Per-session token scope

---

## Troubleshooting

### 403 Forbidden on Form Submission

**Symptom**: Form submission returns 403 error with message "Invalid or missing CSRF token"

**Causes**:

1. **Missing `<CsrfToken />`**: Forgot to add component to form
   
   **Solution**: Add `<CsrfToken />` inside the `<form>` element

2. **Session not established**: User has no session cookie
   
   **Solution**: Visit a GET endpoint first to establish session

3. **Session expired**: User session expired (default: 24 hours)
   
   **Solution**: User needs to refresh and resubmit

4. **AJAX without token**: Token not included in headers
   
   **Solution**: Extract token from form and include in `X-Csrf-Token` header

### Token Not Rendering in Form

**Symptom**: `<CsrfToken />` component renders nothing or `null`

**Causes**:

1. **No session available**: SSR context doesn't have session
   
   **Check**: Verify session middleware is configured in `main.ts`

2. **SSR context not set up**: Request context not passed to `renderPage`
   
   **Check**: Ensure controller passes `request` to `renderPage`:
   ```typescript
   const html = renderPage(<MyComponent />, {
     title: 'Page Title',
     request: req,  // ← Must pass request
   });
   ```

3. **Component imported incorrectly**
   
   **Check**: Import from correct path:
   ```typescript
   import { CsrfToken } from '../../../csrf';  // ✅ Correct
   ```

### AJAX Requests Failing with 403

**Symptom**: Fetch/AJAX POST requests return 403 Forbidden

**Solution**: Include CSRF token in request header:

```javascript
const form = document.getElementById('myForm');
const formData = new FormData(form);
const csrfToken = formData.get('_csrf');

fetch('/api/submit', {
  method: 'POST',
  headers: {
    'X-Csrf-Token': csrfToken,  // ← Include token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: 'value' })
});
```

### Production Session Issues

**Symptom**: Sessions not persisting across server restarts or load balancer requests

**Cause**: Using in-memory session store (default) in production

**Solution**: Use persistent session store (Redis, PostgreSQL):

```typescript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

### Multiple Tabs/Windows

**Symptom**: Form submission fails in second tab/window

**Cause**: Sessions are shared across tabs, token is the same

**Solution**: This is expected behavior. Each session has one token that works across all tabs. If the session expires in one tab, it expires in all tabs. User should refresh to get a new token.

### Testing with curl

**Get token from page**:

```bash
# 1. Get the page and extract token
curl -c cookies.txt http://localhost:3000/form-page > page.html
TOKEN=$(grep -o 'value="[^"]*"' page.html | head -1 | sed 's/value="//;s/"//')

# 2. Submit with token
curl -b cookies.txt -X POST http://localhost:3000/submit \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "_csrf=${TOKEN}&username=test&password=test"
```

---

## Performance

### Overhead

CSRF validation adds minimal overhead:

- **Token generation**: ~0.1ms (only on first request per session)
- **Token validation**: <1ms per request
- **Total overhead**: <5ms per protected request

### Optimization Tips

1. **Token reuse**: Tokens are generated once per session and reused, minimizing crypto operations

2. **Constant-time comparison**: Token validation uses `timingSafeEqual()` to prevent timing attacks while maintaining performance

3. **Session storage**: Choose appropriate session store for your scale:
   - **Development**: In-memory (default)
   - **Small production**: connect-pg-simple (PostgreSQL)
   - **High-scale production**: connect-redis (Redis)

4. **Skip unnecessary routes**: Use `@SkipCsrf()` for API endpoints that use alternative authentication

### Monitoring

Monitor CSRF validation failures for potential attacks:

```typescript
// Logs automatically include:
// - Timestamp
// - Request method and path
// - Failure reason (NO_SESSION, TOKEN_MISMATCH, etc.)
// - Session presence
// - Token presence
```

Check logs for patterns of validation failures that may indicate attack attempts.

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [express-session Documentation](https://github.com/expressjs/session)
- [Implementation Documentation](../implementation_doc/CSRF_PROTECTION_IMPLEMENTATION.md)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Examples](#usage-examples)
3. Consult the [Implementation Documentation](../implementation_doc/CSRF_PROTECTION_IMPLEMENTATION.md)

**Security Issues**: Report security vulnerabilities through appropriate channels, not in public issue trackers.
