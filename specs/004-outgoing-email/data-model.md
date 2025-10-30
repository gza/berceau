# Data Model: Outgoing Email Capability

Although no persistence is required, we define runtime entities and validation rules to guide implementation and tests.

## Entities

### EmailMessage (transient)
- from: string (email) — required, single address
- to: string[] (email) — required, 1..N recipients
- subject: string — required, non-empty, max 200 chars
- html: string — required, rendered from JSX, max ~500KB
- metadata: {
  - messageId?: string (set by provider)
  - provider: 'smtp'
  - sentAt?: Date
}

Validation rules:
- Emails must be RFC 5322 compliant (common validation + reasonable constraints)
- Subject/body must not be logged; `to`/`from` redacted when logged
- Size limit enforced prior to send

### Rendering Input
- body: ReactElement — provided by caller; rendered to HTML via SSR

Validation rules:
- Subject must be non-empty and <= 200 chars

### EmailError (return type)
- type: 'validation' | 'render' | 'send' | 'auth' | 'rate_limit' | 'timeout' | 'unavailable'
- message: string
- code?: string | number
- context?: Record<string, unknown> (no PII)

### EmailConfig (from environment)
- SMTP_HOST: string
- SMTP_PORT: number
- SMTP_USER: string
- SMTP_PASS: string
- SMTP_TLS_ENFORCED: boolean ("true" | "false")
- SMTP_FROM_DEFAULT: string
- TIMEOUT_CONNECT_MS?: number (default 5000)
- TIMEOUT_SEND_MS?: number (default 10000)

## Derived Behaviors

 - Routing: always use SMTP host/port from environment (this can point to Mailpit in dev/test or a real provider in prod)
- TLS: if SMTP_TLS_ENFORCED=true and server lacks TLS → fail with clear error; if false → allow unencrypted SMTP and log "TLS not used"
 - Rendering: SSR JSX to HTML using existing SSR utilities from the provided ReactElement
- Images: helper to embed base64 for local image files (no URL fetching)


