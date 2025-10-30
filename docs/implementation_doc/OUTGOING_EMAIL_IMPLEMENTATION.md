# Outgoing Email Implementation Documentation

**Version**: 1.0  
**Last Updated**: 2025-10-29  
**Feature**: Outgoing Email Capability (004-outgoing-email)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Diagram](#component-diagram)
3. [Data Flow](#data-flow)
4. [Design Decisions](#design-decisions)
5. [Security Measures](#security-measures)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Logging Policy](#logging-policy)
8. [Performance Considerations](#performance-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Configuration Management](#configuration-management)
11. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

The outgoing email capability is implemented as a self-contained NestJS module (`EmailModule`) that provides transactional email sending through SMTP. The design emphasizes simplicity, security, and testability.

### Core Principles

1. **Service-Oriented Architecture**: Email functionality is encapsulated in a single injectable service (`EmailService`) with a clean API
2. **JSX-to-HTML Rendering**: Leverages existing SSR infrastructure to render React components to HTML email bodies
3. **Environment-Based Configuration**: Single SMTP configuration approach for all environments (dev/test use Mailpit, production uses real SMTP provider)
4. **Security by Design**: TLS enforcement, input validation, PII redaction in logs, provider-managed authentication
5. **Test-Driven Development**: Comprehensive unit and integration tests with Mailpit for email capture
6. **Fail-Fast Philosophy**: Validate early, fail with clear errors, never send invalid emails

### Technology Stack

- **Runtime**: Node.js 20+, TypeScript 5.3+
- **Framework**: NestJS 11
- **SMTP Client**: Nodemailer 6.x
- **Rendering**: React 18 + ReactDOMServer (existing SSR infrastructure)
- **Testing**: Jest + Mailpit (Docker-based email capture)
- **Logging**: NestJS Logger with custom PII redaction

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (UserService, OrderService, NotificationService, etc.)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ inject EmailService
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      EmailService                            │
│  • Orchestrates send flow                                    │
│  • Validates input                                           │
│  • Renders JSX to HTML                                       │
│  • Sends via SMTP                                            │
│  • Handles errors                                            │
│  • Logs operations                                           │
└───┬─────────┬─────────┬─────────┬─────────┬────────────────┘
    │         │         │         │         │
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Validate││Renderer││ SMTP   ││ Logger ││ Error  │
│ Input  ││        ││ Sender ││        ││ Builder│
└────────┘└────────┘└────────┘└────────┘└────────┘
    │         │         │         │
    │         │         │         │
    │         │         ▼         │
    │         │    ┌────────────┐ │
    │         │    │  Transport │ │
    │         │    │ (Nodemailer)│ │
    │         │    └──────┬─────┘ │
    │         │           │       │
    │         │           ▼       │
    │         │    ┌────────────┐ │
    │         │    │ SMTP Server│ │
    │         │    │  (Mailpit/ │ │
    │         │    │  Provider) │ │
    │         │    └────────────┘ │
    │         │                   │
    ▼         ▼                   ▼
┌────────────────────────────────────┐
│      Supporting Utilities          │
│  • Base64 embedder                 │
│  • Email config loader             │
│  • Type definitions                │
└────────────────────────────────────┘
```

### Module Structure

```
src/email/
├── email.module.ts           # NestJS module definition
├── email.service.ts          # Main service (orchestration)
├── types.ts                  # TypeScript interfaces
├── config.ts                 # Configuration loading
├── validation.ts             # Input validation
├── renderer.ts               # JSX to HTML rendering
├── smtp-sender.ts            # SMTP sending adapter
├── transport.ts              # Nodemailer transport factory
├── errors.ts                 # Error builder utilities
├── logger.ts                 # Logger with PII redaction
└── testing/
    └── mailpit-client.ts     # Mailpit API helper (test only)
```

---

## Data Flow

### Successful Email Send

```
1. Caller invokes EmailService.send(input)
   └─> Input: { from, to[], cc?, bcc?, subject, body: ReactElement }

2. EmailService validates input
   ├─> Validate email addresses (RFC 5322)
   ├─> Validate subject (max 200 chars, non-empty)
   └─> Return validation error if invalid

3. EmailService renders JSX to HTML
   ├─> Use renderEmailBody(ReactElement) from renderer.ts
   ├─> Leverages ReactDOMServer.renderToStaticMarkup
   └─> Return render error if fails

4. EmailService validates HTML size
   └─> Max 500KB, return validation error if too large

5. EmailService sends via SMTP
   ├─> Create Nodemailer message from input + rendered HTML
   ├─> Call sendViaSmtp(transport, message)
   ├─> Transport sends to SMTP server (Mailpit or provider)
   └─> Return send error if fails

6. EmailService logs success
   ├─> Log metadata: messageId, provider, duration
   └─> Redact email addresses in logs

7. Return success result
   └─> { ok: true, messageId, provider: 'smtp' }
```

### Failed Email Send

```
1. Validation/Render/Send fails at any step

2. EmailService builds EmailError
   ├─> Type: validation | render | send | auth | rate_limit | timeout | unavailable
   ├─> Message: Human-readable error description
   ├─> Code: Optional error code from provider
   └─> Context: Additional debug info (redacted)

3. EmailService logs failure
   ├─> Log error type, message, code, duration
   └─> Redact PII

4. Return failure result
   └─> { ok: false, error: { type, message, code?, context? } }
```

---

## Design Decisions

### 1. JSX Direct Input (No Template Registry)

**Decision**: Callers pass `ReactElement` directly as the `body` parameter.

**Rationale**:
- Simplest API for callers - create email content inline or as helper functions
- No need to maintain a central template registry
- Avoids indirection of `templateId` + `props` lookups
- Aligns with existing SSR patterns in the project

**Alternative Considered**: Template registry with `templateId` and `props` mapping
- Rejected: Adds complexity without clear benefit in v1; can be added later if needed

**Example Usage**:
```tsx
await emailService.send({
  from: 'orders@example.com',
  to: ['customer@example.com'],
  subject: 'Order Confirmed',
  body: (
    <div>
      <h1>Order #{orderId}</h1>
      <p>Total: ${total}</p>
    </div>
  )
})
```

### 2. Single SMTP Configuration Path

**Decision**: Use environment variables to configure SMTP host/port; route to Mailpit in dev/test, real provider in production.

**Rationale**:
- Simplifies configuration surface (one pathway, environment-driven)
- No need for routing flags or multiple transport types
- Consistent behavior across environments (always SMTP)

**Configuration**:
```bash
# Development/Test (.env)
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_TLS_ENFORCED=false

# Production (.env)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_TLS_ENFORCED=true
SMTP_USER=apikey
SMTP_PASS=<secret>
```

### 3. TLS Enforcement Toggle

**Decision**: Configurable TLS enforcement via `SMTP_TLS_ENFORCED` environment variable.

**Rationale**:
- Security requirement: enforce TLS in production
- Flexibility requirement: allow unencrypted SMTP in local dev (Mailpit)
- Fail-fast: if enforced and TLS unavailable, connection fails immediately

**Implementation**:
```typescript
export function createSmtpTransport(config: EmailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // Implicit TLS for port 465
    requireTLS: config.tlsEnforced, // Explicit STARTTLS enforcement
    auth: config.user && config.pass ? {
      user: config.user,
      pass: config.pass
    } : undefined,
  })
}
```

### 4. HTML-Only Emails

**Decision**: Send HTML emails only; no plain text alternative in v1.

**Rationale**:
- Spec requirement: HTML-only to simplify implementation
- Modern email clients render HTML reliably
- Plain text alternative adds complexity (generation, templating, testing)

**Future Enhancement**: Add plain text generation (can be derived from HTML or passed separately)

### 5. Provider-Managed DKIM/SPF

**Decision**: DKIM and SPF handled by SMTP provider and DNS configuration; no app-level signing.

**Rationale**:
- Simplifies application code
- Industry standard approach (provider handles email authentication)
- Avoids key management burden in application

**Setup Required** (Provider/DNS):
- Configure SPF records for sender domain
- Configure DKIM records for sender domain
- Provider signs outgoing messages

### 6. Metadata-Only Logging

**Decision**: Log only metadata; never log subject, body, or full email addresses.

**Rationale**:
- Security by design: prevent PII leakage
- Compliance: GDPR/privacy considerations
- Debugging: metadata (messageId, provider status, error types) sufficient for troubleshooting

**What We Log**:
- ✅ Redacted email addresses (`u***@d***`)
- ✅ Provider name (`smtp`)
- ✅ Message ID (on success)
- ✅ Error type, code, message
- ✅ Duration (ms)
- ✅ Timestamp

**What We Never Log**:
- ❌ Subject line
- ❌ Body content (HTML or JSX)
- ❌ Full email addresses
- ❌ Authentication credentials

### 7. Base64 Image Embedding

**Decision**: Provide `embedImageForEmail()` helper for inline image embedding; only support local files.

**Rationale**:
- Improves email client compatibility for small assets (logos, icons)
- Local files only: avoids external dependencies and security risks
- Size limits prevent abuse (max 100KB per image)

**Alternative Considered**: CID attachments
- Rejected: More complex MIME handling; base64 is simpler and widely supported

**Alternative Considered**: URL fetching
- Rejected: Security risk (SSRF), external dependencies, network failures

---

## Security Measures

### 1. Input Validation

**Email Address Validation**:
- RFC 5322 compliant regex
- Reject invalid formats immediately
- Prevent injection via malformed addresses

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}
```

**Subject Validation**:
- Max 200 characters
- Non-empty
- Prevent header injection

**HTML Size Validation**:
- Max 500KB rendered HTML
- Prevents resource exhaustion
- Ensures provider compatibility

### 2. TLS Enforcement

**Development/Test**:
```bash
SMTP_TLS_ENFORCED=false  # Mailpit doesn't require TLS
```

**Production**:
```bash
SMTP_TLS_ENFORCED=true   # Enforce encrypted connections
```

**Implementation**:
- `requireTLS: true` in Nodemailer config
- Connection fails if TLS unavailable
- Logs warning when TLS not enforced

### 3. Secrets Management

**Environment Variables**:
```bash
SMTP_USER=<username>      # Never hardcode
SMTP_PASS=<password>      # Never commit to repo
```

**Best Practices**:
- Use `.env` files (excluded from Git via `.gitignore`)
- Use secrets managers in production (AWS Secrets Manager, Vault, etc.)
- Rotate credentials regularly
- Never log credentials

### 4. PII Redaction in Logs

**Address Redaction**:
```typescript
export function redactEmail(email: string): string {
  const [user, domain] = email.split('@')
  return `${user[0]}***@${domain[0]}***`
}
// "john.doe@example.com" → "j***@e***"
```

**Subject/Body Protection**:
- Never logged at any level
- Only log error types and codes
- Debug info excludes content

### 5. Error Disclosure

**Internal Errors**:
- Log full error details for debugging
- Redact PII from error context

**External Errors** (to callers):
- Return structured error types
- Include actionable messages
- Exclude sensitive details (credentials, internal paths)

### 6. Rate Limiting

**Current Implementation**:
- Surface provider rate limit errors to callers
- Caller responsible for backoff/retry logic

**Future Enhancement**:
- App-level rate limiting per sender
- Configurable limits per environment

---

## Error Handling Strategy

### Error Type Hierarchy

```typescript
export type SendEmailErrorType =
  | 'validation'     // Invalid input (email format, subject, size)
  | 'render'         // JSX rendering failed
  | 'send'           // SMTP send failed (general)
  | 'auth'           // SMTP authentication failed
  | 'rate_limit'     // Provider rate limit exceeded
  | 'timeout'        // Connection or send timeout
  | 'unavailable'    // SMTP server unreachable
```

### Error Response Structure

```typescript
interface SendEmailFailure {
  ok: false
  error: {
    type: SendEmailErrorType
    message: string           // Human-readable description
    code?: string             // Provider-specific error code
    context?: Record<string, unknown>  // Additional debug info (redacted)
  }
}
```

### Error Handling Flow

1. **Validation Errors**: Fail immediately before rendering or sending
   - Return `{ ok: false, error: { type: 'validation', message: '...' } }`
   - Log validation failure with input details (redacted)

2. **Render Errors**: Catch JSX rendering exceptions
   - Return `{ ok: false, error: { type: 'render', message: '...' } }`
   - Log component name, error message (no JSX content)

3. **SMTP Errors**: Map Nodemailer errors to error types
   - Auth failures → `auth`
   - Rate limits → `rate_limit`
   - Timeouts → `timeout`
   - Connection failures → `unavailable`
   - Other SMTP errors → `send`

4. **Timeout Handling**:
   - Connection timeout: 5 seconds (configurable)
   - Send timeout: 30 seconds (configurable)
   - Fail fast with clear error message

### Caller Responsibilities

```typescript
const result = await emailService.send(input)

if (!result.ok) {
  // Handle error based on type
  switch (result.error.type) {
    case 'validation':
      // Fix input and retry
      break
    case 'auth':
      // Check SMTP credentials
      break
    case 'rate_limit':
      // Backoff and retry later
      break
    case 'timeout':
    case 'unavailable':
      // Retry with exponential backoff
      break
    default:
      // Log and alert
      break
  }
}
```

---

## Logging Policy

### Logging Levels

- **INFO**: Successful email sends (metadata only)
- **WARN**: Non-fatal issues (TLS not enforced, slow render/send)
- **ERROR**: Failed email sends, exceptions

### Log Structure

**Successful Send**:
```json
{
  "level": "info",
  "message": "Email sent successfully",
  "provider": "smtp",
  "messageId": "abc123@smtp.example.com",
  "from": "n***@e***",
  "to": ["u***@e***"],
  "durationMs": 1234,
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

**Failed Send**:
```json
{
  "level": "error",
  "message": "Email send failed",
  "provider": "smtp",
  "errorType": "auth",
  "errorCode": "535",
  "errorMessage": "Authentication failed",
  "from": "n***@e***",
  "to": ["u***@e***"],
  "durationMs": 567,
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

### What We Never Log

- ❌ Full email addresses
- ❌ Subject line
- ❌ Email body (HTML or JSX)
- ❌ SMTP credentials
- ❌ Personal identifiable information (PII)

### PII Redaction Implementation

```typescript
export class EmailLogger {
  logSendAttempt(info: { from: string; to: string[]; provider: string }) {
    this.logger.log({
      message: 'Email send attempt',
      provider: info.provider,
      from: redactEmail(info.from),
      to: info.to.map(redactEmail),
    })
  }
}

function redactEmail(email: string): string {
  const [user, domain] = email.split('@')
  return `${user[0]}***@${domain[0]}***`
}
```

---

## Performance Considerations

### Success Criteria

- **SC-001**: Email delivery within 30s (99% of time)
- **SC-003**: Failures return errors within 2s
- **SC-004**: Handle 10k emails/hour
- **SC-005**: JSX render <200ms per email

### Performance Monitoring

**Metrics Tracked**:
- Render time (JSX to HTML)
- Send time (SMTP round-trip)
- Total duration (validate → render → send)
- Success/failure rates
- Error type distribution

**Implementation**:
```typescript
async send(input: SendEmailInput): Promise<SendEmailResult> {
  const startTime = Date.now()
  
  // ... validation, rendering, sending ...
  
  const durationMs = Date.now() - startTime
  
  // Log performance metrics
  this.logger.log({
    message: 'Email operation complete',
    durationMs,
    renderMs: renderTime,
    sendMs: sendTime,
  })
  
  // Warn if slow
  if (durationMs > 2000) {
    this.logger.warn(`Slow email operation: ${durationMs}ms`)
  }
}
```

### Optimization Strategies

1. **Rendering Performance**:
   - Use `renderToStaticMarkup` (faster than `renderToString`)
   - Avoid complex React components in email templates
   - Cache frequently-used template components (future)

2. **SMTP Connection Pooling**:
   - Nodemailer reuses connections automatically
   - Configure pool size for high-volume scenarios

3. **Parallel Sending**:
   - EmailService is stateless (except transport)
   - Callers can send emails in parallel
   - Consider queue for high-volume scenarios (future)

4. **Size Limits**:
   - Enforce 500KB HTML limit
   - Recommend <100KB for best deliverability
   - Warn on large emails (>200KB)

### Load Testing

**Test Scenario**:
```typescript
// Send 10k emails in 1 hour (2.78 emails/second)
for (let i = 0; i < 10000; i++) {
  await emailService.send({
    from: 'test@example.com',
    to: [`user${i}@example.com`],
    subject: `Test Email ${i}`,
    body: <div>Test body</div>
  })
  await sleep(360) // 360ms = ~2.78/sec
}
```

**Success Criteria**:
- ✅ 99% delivered within 30s
- ✅ 99.5% delivery success rate
- ✅ <200ms render time
- ✅ Failures return within 2s

---

## Testing Strategy

### Test Pyramid

```
           /\
          /  \
         / E2E \         Integration tests (Mailpit)
        /--------\
       /          \
      /   Unit     \     Unit tests (validation, rendering, errors)
     /--------------\
```

### Unit Tests

**Coverage**:
- ✅ Email validation (valid/invalid formats)
- ✅ Subject validation (length, empty)
- ✅ HTML size validation (limits)
- ✅ JSX rendering (success/failure)
- ✅ Error building (all error types)
- ✅ PII redaction (email masking)
- ✅ Base64 image embedding

**Example**:
```typescript
describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmailAddress('user@example.com')).toBe(true)
    expect(validateEmailAddress('user+tag@example.co.uk')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmailAddress('invalid')).toBe(false)
    expect(validateEmailAddress('@example.com')).toBe(false)
    expect(validateEmailAddress('user@')).toBe(false)
  })
})
```

### Integration Tests (Mailpit)

**Setup**:
```yaml
# docker-compose.yml
services:
  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
```

**Coverage**:
- ✅ Email successfully sent to Mailpit
- ✅ Email captured and retrievable via Mailpit API
- ✅ Rendered HTML matches expected structure
- ✅ Failure scenarios (validation, timeout, auth)
- ✅ Various JSX template patterns

**Example**:
```typescript
describe('Email Sending', () => {
  it('should send email to Mailpit', async () => {
    const result = await emailService.send({
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Email',
      body: <div>Test Body</div>
    })

    expect(result.ok).toBe(true)
    
    // Verify via Mailpit API
    const messages = await mailpitClient.searchMessages('recipient@example.com')
    expect(messages).toHaveLength(1)
    expect(messages[0].subject).toBe('Test Email')
  })
})
```

### Manual Testing

**Checklist**:
- [ ] Email renders correctly in Gmail (web)
- [ ] Email renders correctly in Apple Mail (macOS)
- [ ] Email renders correctly on mobile (iOS/Android)
- [ ] Email renders correctly in Outlook (Windows)
- [ ] Images display correctly
- [ ] Links work
- [ ] Spam score acceptable (mail-tester.com)

---

## Configuration Management

### Environment Variables

**Required**:
```bash
SMTP_HOST=localhost          # SMTP server hostname
SMTP_PORT=1025               # SMTP port (25, 587, 465, 1025)
```

**Optional**:
```bash
SMTP_USER=                   # SMTP username (required for auth)
SMTP_PASS=                   # SMTP password (required for auth)
SMTP_TLS_ENFORCED=true       # Enforce TLS (true/false, default: false)
SMTP_FROM_DEFAULT=           # Default from address
TIMEOUT_CONNECT_MS=5000      # Connection timeout (default: 5000ms)
TIMEOUT_SEND_MS=30000        # Send timeout (default: 30000ms)
```

### Configuration Loader

```typescript
export interface EmailConfig {
  host: string
  port: number
  user?: string
  pass?: string
  tlsEnforced: boolean
  fromDefault?: string
  timeoutConnect: number
  timeoutSend: number
}

export function loadEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    tlsEnforced: process.env.SMTP_TLS_ENFORCED === 'true',
    fromDefault: process.env.SMTP_FROM_DEFAULT,
    timeoutConnect: parseInt(process.env.TIMEOUT_CONNECT_MS || '5000', 10),
    timeoutSend: parseInt(process.env.TIMEOUT_SEND_MS || '30000', 10),
  }
}
```

### Validation on Startup

**Module Initialization**:
```typescript
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  async onModuleInit() {
    const config = loadEmailConfig()
    
    // Validate required configuration
    if (!config.host) {
      throw new Error('SMTP_HOST is required')
    }
    
    // Warn if credentials missing in production
    if (process.env.NODE_ENV === 'production') {
      if (!config.user || !config.pass) {
        this.logger.warn('SMTP credentials not configured - authentication may fail')
      }
      if (!config.tlsEnforced) {
        this.logger.warn('TLS not enforced - emails will be sent unencrypted')
      }
    }
  }
}
```

---

## Future Enhancements

### Short-Term (Next Release)

1. **Plain Text Alternative**
   - Generate plain text from HTML automatically
   - Support `plainText` parameter for custom content
   - Improves deliverability and accessibility

2. **Email Templates Library**
   - Pre-built React components for common patterns
   - Responsive layouts
   - Email-client-tested styling

3. **Attachment Support**
   - Allow file attachments (PDF, images, etc.)
   - Size limits and validation
   - MIME type detection

### Medium-Term (Future Releases)

4. **Email Queue**
   - Background job processing (Bull, BullMQ)
   - Retry logic with exponential backoff
   - Priority queues
   - Dead letter queue for failed emails

5. **Template Management UI**
   - Web interface for non-developers
   - Template versioning
   - Preview functionality

6. **Advanced Analytics**
   - Open tracking (pixel-based)
   - Click tracking (link wrapping)
   - Delivery status webhooks
   - Bounce/complaint handling

### Long-Term (Future Roadmap)

7. **Multi-Provider Support**
   - Fallback to secondary provider
   - Provider-specific optimizations
   - Cost optimization routing

8. **Internationalization (i18n)**
   - Multi-language templates
   - Locale-based rendering
   - Character encoding handling

9. **A/B Testing**
   - Template variant testing
   - Subject line optimization
   - Send time optimization

---

## Appendix: Key Files

### Core Implementation

- `src/email/email.service.ts` - Main service orchestration
- `src/email/types.ts` - TypeScript type definitions
- `src/email/config.ts` - Configuration loading
- `src/email/validation.ts` - Input validation
- `src/email/renderer.ts` - JSX to HTML rendering
- `src/email/smtp-sender.ts` - SMTP sending adapter
- `src/email/transport.ts` - Nodemailer transport factory
- `src/email/errors.ts` - Error builder
- `src/email/logger.ts` - Logging with PII redaction

### Tests

- `src/email/*.spec.ts` - Unit tests
- `tests/integration/email*.spec.ts` - Integration tests

### Documentation

- `docs/dev_guides/OUTGOING_EMAIL_GUIDE.md` - Developer guide
- `docs/implementation_doc/OUTGOING_EMAIL_IMPLEMENTATION.md` - This file
- `specs/004-outgoing-email/` - Feature specification and planning

---

## Summary

The outgoing email capability provides a simple, secure, and testable solution for sending transactional emails via SMTP. The architecture emphasizes:

- ✅ **Simplicity**: Direct JSX input, single SMTP path, minimal configuration
- ✅ **Security**: TLS enforcement, input validation, PII redaction, fail-fast errors
- ✅ **Testability**: Comprehensive unit/integration tests with Mailpit
- ✅ **Performance**: <200ms rendering, <30s delivery, 10k emails/hour capacity
- ✅ **Maintainability**: Clean separation of concerns, well-documented API

For developer usage, see the [Outgoing Email Guide](../dev_guides/OUTGOING_EMAIL_GUIDE.md).
