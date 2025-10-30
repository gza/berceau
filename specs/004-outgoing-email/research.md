# Research: Outgoing Email Capability

This document consolidates decisions, rationale, and alternatives explored to resolve all clarifications and design unknowns for feature 004-outgoing-email.

## Decisions

- Decision: SMTP via Nodemailer
  - Rationale: Mature, well-maintained SMTP client with robust TLS/auth support, retries/codes parsing, and simple API. Minimizes custom code and is easy to replace.
  - Alternatives considered: Direct SMTP (net/tls) — higher effort and fragility; Provider SDKs (SES, SendGrid) — increases vendor lock-in and diverges from SMTP-first requirement.

- Decision: Direct JSX element input (no registry) rendered via SSR to HTML
  - Rationale: Simplest API for callers; aligns with existing SSR; avoids maintaining a template registry and ids.
  - Alternatives considered: Template registry with `templateId` and `props` — adds indirection and catalog maintenance without clear benefits in v1; Handlebars/MJML — extra stack.

- Decision: SMTP-only configuration (use Mailpit by pointing SMTP host/port)
  - Rationale: Simpler configuration surface; always use SMTP with environment-provided host/port (Mailpit in dev/test, provider in prod).
  - Alternatives considered: Explicit routing flags — more moving parts without added benefits; In-memory sink — no UI for inspection.

- Decision: TLS enforcement configurable
  - Rationale: Spec requires enforcement toggle. Fail when enforced and TLS unavailable; allow unencrypted SMTP only when explicitly disabled and log it.
  - Alternatives considered: Always-TLS — stronger security but conflicts with environments lacking TLS; Always-allow unencrypted — unacceptable security posture.

- Decision: DKIM/SPF managed by provider (no app-level signing)
  - Rationale: Simplifies app; places responsibility on SMTP provider/DNS records per spec.
  - Alternatives considered: App-level DKIM signing — adds complexity and key management burden.

- Decision: Logging policy (metadata only)
  - Rationale: Security by design and PII minimization. Log template id, provider status/message id, and redacted addresses; never log subject/body.
  - Alternatives considered: Full payload logging — violates security and privacy requirements.

- Decision: Size limits for rendered HTML
  - Rationale: Enforce reasonable size ceilings (e.g., ~500KB) before send to avoid client/provider issues and provider rejections.
  - Alternatives considered: No limits — risk of deliverability failures and poor UX.

- Decision: Base64 images helper
  - Rationale: Improves cross-client reliability for small inline assets; only local image files are supported to avoid external dependencies and security concerns.
  - Alternatives considered: CID attachments — more complex MIME handling; External links only — can be blocked by clients; URL fetching — introduces security and dependency risks.

- Decision: Client compatibility validation (infrastructure-level)
  - Rationale: Validate core HTML scaffolding with caniemail (documentation and periodic check) while keeping templates simple and in our control.
  - Alternatives considered: Full client matrix testing — heavy and out-of-scope for v1.

## Interface and Error Model

- Send API (concept):
  - Input: from, to[], subject (string), body: ReactElement
  - Output: { ok: true, messageId, provider: 'smtp' } | { ok: false, error: { type, code?, message, context } }
  - Error types: validation, render, send, auth, rate_limit, timeout, unavailable

## Open Questions (resolved)

- FR conflict (FR-007 duplicates with conflicting requirements): Later statement mandates HTML-only. Resolution: HTML-only.
- Localization: Out-of-scope; single language.

## Notes on Ops & Security

- Secrets via environment (.env): SMTP_USER, SMTP_PASS; ensure not logged.
- Redaction: mask emails as `u***@d***` in logs; do not emit subject/body.
- Timeouts: conservative defaults (e.g., connect 5s, send 10s) configurable via env.
- Rate limiting: surface provider errors; caller responsible for backoff.
