# Quickstart: Outgoing Email Capability

This guide explains how to run the email feature locally (Mailpit) and how it works in production (SMTP).

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- This repository checked out on branch `004-outgoing-email`

## Environment Variables (.env)

Add the following to your `.env` at the repo root (values as appropriate):

```
# SMTP (Mailpit defaults shown); override for production provider
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_TLS_ENFORCED=false
SMTP_FROM_DEFAULT="no-reply@example.com"

# Optional timeouts (ms)
TIMEOUT_CONNECT_MS=5000
TIMEOUT_SEND_MS=10000
```

## Start Dependencies

- Start Docker Compose (includes Mailpit when added in implementation):
  - VS Code Task: "Docker: Compose Up" (recommended)
  - Or CLI: `docker compose up --build`

- Start the dev server:
  - VS Code Task: "Run Dev Server"

Mailpit UI (when implemented in compose) is expected at http://localhost:8025. Using Mailpit simply means pointing SMTP_HOST/SMTP_PORT to the Mailpit container.

## Use the Internal API (once implemented)

- TypeScript API (see `specs/004-outgoing-email/contracts/email-service.md`):
  ```ts
  import { EmailService } from 'src/email'
  import { WelcomeEmail } from 'src/email/templates/WelcomeEmail'

  const result = await EmailService.send({
    from: 'no-reply@example.com',
    to: ['user@example.com'],
    subject: 'Hello',
    body: <WelcomeEmail name="User" />,
  })

  if (!result.ok) {
    // handle error: result.error
  }
  ```

- Verify in Mailpit UI that the email arrived and the render is correct.

## Testing

- Unit + Integration tests will cover:
  - Parameter validation (reject invalid emails, size limits)
  - JSX rendering
  - SMTP send success/failure paths
  - End-to-end against Mailpit (capture and inspect message)

Run:

```
npm test && npm run lint
```

## Notes

- Do not log subject/body. Email addresses must be redacted in logs (e.g., `u***@d***`).
- TLS enforcement should be enabled in production; if a server does not support TLS and enforcement is on, sending must fail clearly.
- Custom SMTP headers are not supported.
