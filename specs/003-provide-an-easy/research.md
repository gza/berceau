# Research: CSRF Token Protection for UI Forms

**Feature**: 003-provide-an-easy  
**Date**: 2025-10-24  
**Status**: Complete

## Overview

This document consolidates research findings for implementing CSRF protection in the NestJS + TSX SSR application following OWASP recommendations and NestJS best practices.

## Research Areas

### 1. Session Management (express-session)

**Decision**: Use `express-session` v1.18.1+ for server-side session storage of CSRF tokens

**Rationale**:
- **OWASP Recommendation**: Synchronizer Token Pattern requires server-side token storage
- **NestJS Compatibility**: Well-integrated with NestJS via `@nestjs/platform-express`
- **Production-Ready**: Mature library with 9.0 trust score, widely used in enterprise applications
- **Session Stores**: Supports multiple backends (memory for dev, Redis/PostgreSQL for production)

**Implementation Details**:
```typescript
// Configure in main.ts
import * as session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET, // Strong secret from environment
  resave: false,                      // Don't save session if unmodified
  saveUninitialized: false,           // Don't create session until something stored
  cookie: {
    httpOnly: true,                   // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',                  // CSRF protection via SameSite
    maxAge: 24 * 60 * 60 * 1000      // 24 hours
  }
}));
```

**Alternatives Considered**:
- **JWT-based sessions**: Rejected because OWASP explicitly recommends Synchronizer Token Pattern over stateless approaches for form-based CSRF protection
- **In-memory sessions**: Acceptable for development, but production requires persistent store (Redis, PostgreSQL)
- **cookie-session**: Rejected because it stores session data in cookies, which violates the Synchronizer Token Pattern's requirement for server-side storage

### 2. CSRF Token Pattern (OWASP Guidance)

**Decision**: Implement Synchronizer Token Pattern with per-session tokens

**Rationale**:
- **OWASP Top 10**: Cross-Site Request Forgery (CSRF) is a critical web application vulnerability
- **Synchronizer Token Pattern**: Most secure pattern for server-rendered applications
  - Tokens stored server-side in session (not in cookies or client-side storage)
  - Tokens transmitted in HTML forms as hidden input fields
  - Server validates token on state-changing requests (POST, PUT, DELETE, PATCH)
- **SameSite Cookie Attribute**: Additional defense layer (already configured in session cookies)

**Key Security Requirements** (from OWASP):
1. **Cryptographically Secure Tokens**: Use `crypto.randomBytes(32)` for token generation
2. **Server-Side Validation**: Never trust client-provided tokens without server verification
3. **Per-Session Scope**: Bind tokens to authenticated sessions
4. **State-Changing Methods Only**: GET, HEAD, OPTIONS exempt from validation
5. **Synchronous Validation**: Validate before processing any request data

**Token Lifecycle**:
```
1. User requests page → Server generates token → Store in session
2. Server renders form with token as hidden input
3. User submits form → Token sent in request body
4. Server validates token from request against session
5. If valid: process request; If invalid: reject with 403
6. Token remains valid for session lifetime
```

**Alternatives Considered**:
- **Double Submit Cookie Pattern**: Rejected because OWASP rates it as less secure than Synchronizer Token (susceptible to subdomain attacks)
- **HMAC-based tokens**: Unnecessarily complex for our use case; Synchronizer Pattern is simpler and equally secure
- **Per-request tokens**: Rejected due to complexity with browser back button and multiple tabs

### 3. NestJS Integration (Guards & Middleware)

**Decision**: Implement CSRF protection using NestJS Guards with custom decorator for opt-out

**Rationale**:
- **Guard Pattern**: NestJS guards are designed for request validation and authorization
- **Execution Context**: Guards have access to full execution context (request, response, handler metadata)
- **Declarative Opt-Out**: `@SkipCsrf()` decorator using `SetMetadata` for API endpoints
- **Reflector API**: Use `Reflector` to check for opt-out metadata
- **Global Application**: Register guard globally via `APP_GUARD` provider

**Implementation Pattern** (from NestJS documentation):
```typescript
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private csrfService: CsrfService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for @SkipCsrf() decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(
      SKIP_CSRF_KEY,
      [context.getHandler(), context.getClass()]
    );
    
    if (skipCsrf) {
      return true; // Allow request without CSRF validation
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method.toUpperCase();

    // Exempt safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Validate CSRF token
    return this.csrfService.validateToken(request);
  }
}
```

**Alternatives Considered**:
- **Middleware Approach**: Rejected because guards provide better integration with NestJS decorators and metadata
- **Interceptors**: Not suitable for request rejection (guards execute before interceptors)
- **Third-party packages** (`csurf`, `csrf-csrf`): Rejected to maintain full control and avoid dependencies that may not integrate well with SSR

### 4. Token Generation & Validation Service

**Decision**: Create dedicated `CsrfService` for token lifecycle management

**Rationale**:
- **Single Responsibility**: Separate token logic from guard logic
- **Testability**: Service can be unit tested independently
- **Cryptographic Security**: Use Node.js `crypto` module for secure random token generation
- **Session Integration**: Service reads/writes tokens from Express session

**Token Generation Algorithm**:
```typescript
import { randomBytes, timingSafeEqual } from 'crypto';

export class CsrfService {
  private readonly TOKEN_LENGTH = 32; // 256 bits
  private readonly SESSION_KEY = '_csrf';

  generateToken(session: any): string {
    // Generate cryptographically secure random token
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');
    
    // Store in session
    session[this.SESSION_KEY] = token;
    
    return token;
  }

  getToken(session: any): string | undefined {
    return session[this.SESSION_KEY];
  }

  validateToken(request: any): boolean {
    const session = request.session;
    const tokenFromSession = this.getToken(session);
    
    if (!tokenFromSession) {
      return false; // No token in session
    }

    // Token can be in body, query, or header
    const tokenFromRequest = 
      request.body?._csrf ||
      request.query?._csrf ||
      request.headers['x-csrf-token'];  // Lowercase - Express normalizes all header names

    if (!tokenFromRequest) {
      return false; // No token in request
    }

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeEqual(tokenFromSession, tokenFromRequest);
  }

  private constantTimeEqual(a: string, b: string): boolean {    
    try {
      return timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8')
      );
    } catch {
      return false;
    }
  }
}
```

**Token Transmission**:
- **Hidden Form Field**: `<input type="hidden" name="_csrf" value="{token}" />`
- **HTTP Header**: `X-CSRF-Token: {token}` (for AJAX requests - sent as 'X-CSRF-Token', accessed as 'x-csrf-token')
- **Query Parameter**: `?_csrf={token}` (fallback, less preferred)

### 5. JSX Component for Token Injection

**Decision**: Create `<CsrfToken />` server-side JSX component

**Rationale**:
- **Developer Experience**: Single import and component tag to protect forms
- **SSR Integration**: Component renders to HTML hidden input during server-side rendering
- **Request Context**: Token retrieved from current request's session via dependency injection
- **Type Safety**: TypeScript interface ensures proper usage

**Component Implementation**:
```tsx
import { Injectable } from '@nestjs/common';
import { CsrfService } from './csrf.service';

export interface CsrfTokenProps {
  /** Optional custom field name (defaults to '_csrf') */
  fieldName?: string;
  /** Optional ID for the input element */
  id?: string;
}

/** 
 * Server-side JSX component that renders a hidden input with CSRF token.
 * The token is automatically retrieved from the current request's session.
 * 
 * Usage:
 * ```tsx
 * import { CsrfToken } from '@/csrf/csrf-token.component';
 * 
 * <form method="POST" action="/submit">
 *   <CsrfToken />
 *   <input type="text" name="data" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export function CsrfToken(props: CsrfTokenProps = {}): JSX.Element {
  const { fieldName = '_csrf', id } = props;
  
  // Token must be injected via rendering context
  // Implementation will use AsyncLocalStorage or request scope
  const token = getCsrfTokenFromContext();
  
  return (
    <input
      type="hidden"
      name={fieldName}
      id={id}
      value={token}
      data-testid="csrf-token"
    />
  );
}
```

**Context Injection Pattern**:
- Use NestJS's request-scoped providers or AsyncLocalStorage
- Token available throughout rendering pipeline
- No prop drilling required

### 6. Programmatic Token Access (User Story 1)

**Decision**: Provide token accessor function and metadata for JavaScript

**Rationale**:
- **Testing Requirements**: Automated tests need programmatic access to tokens
- **AJAX/Fetch API**: Client-side JavaScript may need to include tokens in headers
- **Meta Tag Pattern**: Standard approach used by frameworks (Rails, Django, Laravel)

**Implementation**:
```tsx
// In HtmlDocument component, add meta tag:
<head>
  <meta name="csrf-token" content={csrfToken} />
  <meta name="csrf-param" content="_csrf" />
</head>

// JavaScript accessor utility:
export function getCsrfToken(): string {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || '';
}

export function getCsrfParam(): string {
  const meta = document.querySelector('meta[name="csrf-param"]');
  return meta?.getAttribute('content') || '_csrf';
}

// Usage in fetch:
const token = getCsrfToken();
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token
  },
  body: JSON.stringify(data)
});
```

### 7. Opt-Out Configuration (User Story 4)

**Decision**: Use `@SkipCsrf()` decorator for explicit opt-out

**Rationale**:
- **Explicit Over Implicit**: Developers must consciously opt out of protection
- **Route-Level Control**: Applied to individual controllers or handlers
- **Auditable**: Easy to grep codebase for `@SkipCsrf()` usage
- **Documentation**: Decorator can include JSDoc warnings about alternative authentication

**Decorator Implementation**:
```typescript
import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF validation for specific routes.
 * 
 * ⚠️ WARNING: Routes with @SkipCsrf() MUST implement alternative
 * authentication mechanisms (e.g., JWT, OAuth, API keys).
 * 
 * Use cases:
 * - REST APIs with token-based authentication
 * - Public webhooks with signature validation
 * - Third-party integrations with API keys
 * 
 * @example
 * ```typescript
 * @Controller('api')
 * export class ApiController {
 *   @SkipCsrf()
 *   @UseGuards(JwtAuthGuard) // Alternative authentication
 *   @Post('data')
 *   create(@Body() data: CreateDto) {
 *     // ...
 *   }
 * }
 * ```
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
```

**Alternative Approaches Considered**:
- **Path-based exemption**: Rejected because it's less explicit and harder to audit
- **Content-Type based**: Rejected because form-based endpoints may use `application/json`
- **Global opt-in**: Rejected because it would require protecting every form manually (opposite of spec requirement)

### 8. Performance Considerations

**Decision**: Optimize for < 5ms latency overhead (per spec SC-007)

**Rationale**:
- Token generation: ~0.1ms (using `crypto.randomBytes`)
- Session lookup: ~0.5ms (in-memory store) to ~2ms (Redis)
- String comparison: ~0.01ms (constant-time comparison of 64-byte strings)
- Total estimated overhead: ~1-3ms (well under 5ms requirement)

**Optimization Strategies**:
1. **Token Caching**: Generate token once per session, reuse for all requests
2. **Lazy Generation**: Only generate token when `<CsrfToken />` component is rendered
3. **Guard Short-Circuit**: Early return for safe methods (GET, HEAD, OPTIONS)
4. **Session Store**: Use Redis for production with connection pooling

**Monitoring**:
- Add timing metrics to guard and service
- Log validation failures for security monitoring
- Track token generation rate

### 9. Error Handling & User Experience

**Decision**: Return 403 Forbidden with clear error message

**Rationale**:
- **HTTP Semantics**: 403 indicates forbidden access (appropriate for CSRF failures)
- **Security**: Don't leak implementation details in error messages
- **Logging**: Log detailed information server-side for debugging
- **Recovery**: Clear message guides developers to fix form implementation

**Error Response**:
```typescript
throw new ForbiddenException({
  statusCode: 403,
  message: 'Invalid or missing CSRF token',
  error: 'Forbidden'
});

// Logged server-side (not sent to client):
logger.warn('CSRF validation failed', {
  path: request.url,
  method: request.method,
  sessionId: request.session.id,
  tokenPresent: !!tokenFromRequest,
  tokenValid: false
});
```

### 10. Testing Strategy

**Decision**: Comprehensive test coverage across unit, integration, and end-to-end tests

**Test Categories**:

**Unit Tests** (Jest):
- `CsrfService`: Token generation, validation, constant-time comparison
- `CsrfGuard`: Opt-out logic, safe method exemption, Reflector integration
- `CsrfToken` component: Rendering with different props

**Integration Tests** (Supertest):
- Form submission with valid token → 200/303
- Form submission without token → 403
- Form submission with invalid token → 403
- Form submission with expired session token → 403
- GET request without token → 200 (safe method)
- API endpoint with `@SkipCsrf()` → 200

**End-to-End Tests**:
- Multiple forms on same page (unique tokens per session, not per form)
- Multiple tabs with different sessions
- Token persistence across requests in same session
- Token expiration with session
- Programmatic token access from meta tag

**Example Integration Test**:
```typescript
describe('CSRF Protection Integration', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    agent = request.agent(app.getHttpServer()); // Maintains session
  });

  it('should accept form submission with valid CSRF token', async () => {
    // Get form page (establishes session and generates token)
    const formResponse = await agent.get('/demo/posts');
    expect(formResponse.status).toBe(200);
    
    // Extract token from HTML
    const tokenMatch = formResponse.text.match(/name="_csrf" value="([^"]+)"/);
    const token = tokenMatch?.[1];
    expect(token).toBeDefined();

    // Submit form with token
    const submitResponse = await agent
      .post('/demo/posts')
      .send({
        _csrf: token,
        title: 'Test Post',
        authorName: 'Test Author',
        authorEmail: 'test@example.com'
      });
    
    expect(submitResponse.status).toBe(303); // Redirect after success
  });

  it('should reject form submission without CSRF token', async () => {
    // Establish session
    await agent.get('/demo/posts');

    // Submit form without token
    const submitResponse = await agent
      .post('/demo/posts')
      .send({
        title: 'Test Post',
        authorName: 'Test Author',
        authorEmail: 'test@example.com'
      });
    
    expect(submitResponse.status).toBe(403);
    expect(submitResponse.body.message).toContain('CSRF');
  });

  it('should allow API endpoint with @SkipCsrf()', async () => {
    const response = await agent
      .post('/api/data')
      .set('Authorization', 'Bearer valid-jwt-token')
      .send({ data: 'test' });
    
    expect(response.status).toBe(200);
  });
});
```

## Implementation Checklist

- [x] Research OWASP CSRF prevention best practices
- [x] Research NestJS guard and middleware patterns
- [x] Research express-session integration
- [x] Define token generation algorithm
- [x] Define token validation strategy
- [x] Define JSX component interface
- [x] Define opt-out decorator API
- [x] Define error handling approach
- [x] Define testing strategy

## Next Steps

Proceed to Phase 1:
1. Generate `data-model.md` with entities (CSRF Token, Session, Configuration)
2. Generate `contracts/` with TypeScript interfaces and API specifications
3. Generate `quickstart.md` for developer onboarding
4. Update agent context with CSRF protection technologies

## References

- **OWASP CSRF Prevention Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- **NestJS Guards Documentation**: https://docs.nestjs.com/guards
- **NestJS Custom Decorators**: https://docs.nestjs.com/custom-decorators
- **Express Session Documentation**: https://github.com/expressjs/session
- **Node.js Crypto Module**: https://nodejs.org/api/crypto.html
- **React SSR Security**: Server-side rendering security considerations
