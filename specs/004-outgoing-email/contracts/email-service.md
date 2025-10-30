# Email Service Contract (Internal JS/TS API)

This feature exposes an internal service only. No REST endpoints are added.

## TypeScript Interfaces

```ts
import type { ReactElement } from "react"

export type EmailAddress = string // RFC 5322-compliant (validated)

export type SendEmailErrorType =
  | 'validation'
  | 'render'
  | 'send'
  | 'auth'
  | 'rate_limit'
  | 'timeout'
  | 'unavailable';

export interface SendEmailInput {
  from: EmailAddress
  to: EmailAddress[] // 1..N
  subject: string // <= 200 chars
  body: ReactElement // JSX body to render server-side to HTML
}

export interface SendEmailSuccess {
  ok: true
  messageId: string // provider-assigned id
  provider: 'smtp'
}

export interface SendEmailFailure {
  ok: false
  error: {
    type: SendEmailErrorType
    message: string
    code?: string | number
    context?: Record<string, unknown> // no PII
  }
}

export type SendEmailResult = SendEmailSuccess | SendEmailFailure

export interface EmailService {
  send(input: SendEmailInput): Promise<SendEmailResult>
}
```

## Behavior

- Validation: reject invalid emails, empty/oversized subject/body, and excessive HTML size before send.
- Rendering: SSR JSX to HTML from the provided ReactElement; HTML-only (no text part).
 - Security: never log subject/body; redact addresses in logs; TLS is configured globally (no per-call toggle).
- Transport: always SMTP, configured via env (Mailpit in dev/test by host/port, provider in prod).
- Errors: surface provider/auth/timeout/rate-limit clearly; no auto-retries in v1 (caller decides).
