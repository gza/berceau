# Feature Specification: Outgoing Email Capability

**Feature Branch**: `004-outgoing-email`  
**Created**: 2025-10-27  
**Status**: Draft  
**Input**: User description: "I want to add outgoing email capability"

## Clarifications

### Session 2025-10-27

- Q: Should TLS be strictly required in production or can we fall back to unencrypted SMTP? → A: Enabled/Disabled by conf
- Q: DKIM strategy — provider-managed or app-level signing? → A: Provider-managed DKIM/SPF; no app signing
- Q: What is the logging policy for PII and email content? → A: Metadata only; redact PII; never log subject/body
<!-- Decision: Emails are HTML-only. -->
- Q: Should email templates support localization? → A: No localization; single language only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Transactional Email (Priority: P1)

The system needs to send transactional emails to users for important system events and notifications. These emails are triggered by specific user actions or system events and must be delivered reliably. Examples include form submissions, status updates, system alerts, and event confirmations.

**Why this priority**: Transactional emails are essential for basic system-to-user communication. Without this functionality, users cannot receive important notifications about their actions or system events, making it the foundation of email capability.

**Independent Test**: Can be fully tested by triggering a system event (like a form submission) and verifying the email is delivered with correct content. Delivers immediate value by enabling core notification features.

**Acceptance Scenarios**:

1. **Given** a user submits a contact form, **When** the system processes the submission, **Then** a confirmation email is sent to the user's email address within 30 seconds
2. **Given** a system event occurs, **When** the event needs user notification, **Then** an appropriate notification email is sent to the affected user
3. **Given** an email fails to send, **When** the failure is detected, **Then** the system logs the error with detailed information and returns failure details to the caller
4. **Given** invalid parameters are provided (recipient email, sender email, subject, etc.), **When** the system attempts to send an email, **Then** validation fails before sending and detailed error information is returned to the caller

---

### User Story 2 - Email Template Management (Priority: P2)

The system needs to manage email templates using JSX server-side rendering, consistent with the application's UI approach. Templates should support dynamic content through JSX components and props while maintaining consistent branding and styling.

**Why this priority**: JSX-based email templates provide consistency with the application's UI architecture, enable component reuse, and allow developers to use familiar tools. Templates can leverage the same SSR infrastructure already in place. However, basic emails can be sent with simple JSX templates initially.

**Independent Test**: Can be tested by creating a JSX email component with props, rendering it server-side, sending the email, and verifying the output contains correctly rendered HTML. Delivers value by enabling developers to create maintainable, type-safe email templates using existing skills.

**Acceptance Scenarios**:

1. **Given** an email template written as a JSX component with props, **When** an email is generated from the template, **Then** all props are correctly rendered into HTML
2. **Given** a template includes formatting (bold, links, images), **When** the email is rendered via SSR, **Then** the formatting is preserved correctly in the recipient's email client
3. **Given** an email template includes images, **When** the email is rendered, **Then** images can be embedded as base64 data URIs for reliable display across email clients

---

### User Story 3 - Email Testing Support (Priority: P3)

The system needs to support email testing in development and test environments using a mail capture tool like Mailpit (similar to how PostgreSQL is used for database testing). This enables developers to test email functionality without sending real emails.

**Why this priority**: Email testing infrastructure is essential for TDD and development workflow. Without it, developers cannot verify email content, templates, or delivery logic during development. This follows the project's pattern of using Docker Compose for development dependencies.

**Independent Test**: Can be tested by configuring Mailpit in Docker Compose, sending a test email, and verifying it appears in Mailpit's web interface with correct content. Delivers value by enabling rapid email development and automated testing.

**Acceptance Scenarios**:

1. **Given** Mailpit is running via Docker Compose, **When** the system sends an email in development/test mode, **Then** the email is captured in Mailpit and visible in its web interface
2. **Given** automated tests are running, **When** a test triggers email sending, **Then** the test can query Mailpit's API to verify email content and delivery
3. **Given** a developer is working on email templates, **When** they trigger an email, **Then** they can immediately view the rendered email in Mailpit without external email services
4. **Given** multiple emails are sent during testing, **When** accessing Mailpit, **Then** all emails are captured and can be inspected individually

---

### Edge Cases

- What happens when the email service provider is temporarily unavailable?
  - The send operation fails immediately with service unavailable error
  - Detailed error information is returned to the caller for handling
  - Caller decides whether to retry or handle the failure

- What happens when SMTP server connection times out?
  - Connection timeout error is returned immediately with details
  - Error includes timeout duration and SMTP server details
  - Caller decides whether to retry with different timeout settings
  
- How does the system handle extremely large email content?
  - Emails exceeding reasonable size limits are rejected with clear error message before sending
  - Error details specify the size limit and actual size

- What happens when JSX email component rendering fails?
  - The error is caught and logged with component details and stack trace
  - Detailed error information is returned to the caller
  - No email is sent when rendering fails
  
- How does system handle rate limiting by the email service provider?
  - Rate limit errors are returned to the caller with details about the limit
  - Caller is responsible for implementing backoff or queuing strategy if needed
  - System logs rate limit occurrences for monitoring

- What happens when SMTP server does not support TLS?
  - If TLS enforcement is enabled, the send fails with a clear error (no unencrypted fallback)
  - If TLS enforcement is disabled, system falls back to unencrypted SMTP and logs that TLS was not used
  - TLS enforcement behavior is controlled by configuration

- What happens when SMTP authentication fails?
  - Authentication error is returned immediately with details
  - Error is logged with SMTP response codes
  - No email is sent when authentication fails

- What happens when email contains malicious content or spam triggers?
  - Email content is authored internally; no user-generated HTML is accepted
  - Validation failures (e.g., size limits, invalid links) return detailed error information to caller

- How does the system distinguish between test/development and production email sending?
  - Environment configuration determines whether to use Mailpit (dev/test) or real provider (production)
  - Clear indicators prevent accidental production emails during development

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send transactional emails (form confirmations, system notifications, event alerts) reliably with delivery confirmation
- **FR-002**: System MUST support email templates written as JSX components using server-side rendering
- **FR-003**: System MUST render JSX email components to HTML with proper email client compatibility
- **FR-004**: System MUST validate all email parameters before attempting to send (recipient addresses, sender address, subject, template props, etc.)
- **FR-005**: System MUST return detailed error information to callers when email sending fails, including error type, message, and relevant context
- **FR-006**: System MUST log email events using NestJS Logger with metadata only (e.g., operation type, provider status, message id); MUST NOT log subject or body content. Email addresses MUST be redacted (e.g., mask as `u***@d***`).
<!-- Former dual-format requirement removed; emails are HTML-only. -->
- **FR-007**: System MUST send HTML email format.
<!-- Sanitization requirement removed: emails are constructed from internal JSX (no user HTML). Security is enforced via validation, size limits, and transport configuration. -->
- **FR-008**: System MUST support SMTP authentication and TLS. TLS enforcement MUST be configurable. When TLS enforcement is enabled and TLS is unavailable, sending MUST fail; when disabled, the system MAY fall back to unencrypted SMTP with explicit logging.
- **FR-009**: System MUST support environment-based email routing (Mailpit for dev/test, SMTP server for production)
- **FR-010**: System MUST integrate with Mailpit via Docker Compose for development and testing
- **FR-011**: System MUST provide API or utilities for tests to verify email content via Mailpit
- **FR-012**: System MUST provide helpers to embed images as base64 data URIs in email templates for reliable cross-client display
- **FR-013**: System-provided email rendering infrastructure (not user content) MUST be validated for email client compatibility using canimail or similar tools
- **FR-014**: System MUST operate in a single language; email subjects and bodies are not localized in this iteration.

Note: Custom SMTP headers are not supported.

### Key Entities *(include if feature involves data)*

- **Email Message**: Represents an individual email with sender, recipient(s), subject, body content (rendered from JSX), used transiently during processing (not persisted)
- **Email Template (JSX Component)**: Reusable JSX component that accepts props and renders to HTML, includes subject generation, body rendering (HTML), and template category (transactional, notification, marketing)
- **Email Error**: Detailed error information returned to callers including error type (validation, rendering, sending, rate limit), error message, and relevant context
- **Email Configuration**: Stores settings for email service integration including SMTP host, port, authentication credentials (username/password), TLS settings, sender addresses, and environment-specific routing (Mailpit vs. production SMTP server)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Transactional emails (form confirmations, notifications) are delivered within 30 seconds of being triggered 99% of the time
- **SC-002**: System successfully delivers 99.5% of emails to valid addresses on first attempt
- **SC-003**: Email send failures return detailed error information to caller within 2 seconds
- **SC-004**: System handles email volumes of up to 10,000 emails per hour without degradation in delivery times
- **SC-005**: JSX email component rendering completes in under 200 milliseconds per email
- **SC-006**: Developers can set up email testing environment (Mailpit) with a single Docker Compose command
- **SC-007**: Automated tests can verify email content within 1 second of sending via Mailpit API
- **SC-008**: Administrators can identify and resolve email delivery issues using system logs within 5 minutes
- **SC-009**: Invalid parameters (recipient email, sender email, subject, etc.) are detected before send attempt 99% of the time with clear error messages
- **SC-010**: System successfully connects to SMTP servers and establishes TLS connections (when supported) 99.9% of the time

## Assumptions

1. **Email Service Provider**: The system will use outgoing SMTP with authentication and TLS (if supported by the server) for sending emails. This approach:
   - Provides direct control over email sending infrastructure
   - Supports standard SMTP authentication mechanisms
   - Uses TLS encryption when available for secure transmission
   - Can work with any SMTP server (corporate mail servers, managed SMTP services, etc.)

2. **Authentication**: Email sending will be initiated by system processes in response to user actions or system events. No user authentication is required at this stage.

3. **Logging**: Email events will be logged using NestJS Logger (metadata only) rather than stored in a database. Personally identifiable information (e.g., email addresses) will be redacted/masked; subject and body content will never be logged. Log retention follows the application's standard logging configuration (e.g., rotation, aggregation). No specialized email history database tables are needed.

4. **Volume**: Expected email volume is moderate (under 50,000 emails per day). If higher volumes are anticipated, additional considerations for scalability and cost management will be needed.

5. **JSX Email Rendering**: Email templates will use the same JSX SSR infrastructure as the UI, ensuring consistency in development approach and enabling code reuse. Email-specific HTML rendering considerations (email client compatibility) will be handled by the rendering layer. The system-provided rendering infrastructure will be validated using canimail or similar email compatibility tools to ensure broad email client support.

6. **Development Environment**: Mailpit will be integrated into Docker Compose alongside PostgreSQL, following the established pattern of containerized development dependencies. This ensures consistent development experience across the team.

7. **Error Handling Philosophy**: The email service follows a "fail fast" approach - errors are returned immediately to callers with detailed information rather than being hidden behind retry logic or queuing. This gives calling code full control over error handling, retry strategies, and user feedback.

8. **Unsubscribe Mechanism**: Non-critical emails (newsletters, marketing) will include unsubscribe links and honor user preferences. Transactional notification emails (order confirmations, system alerts) cannot be unsubscribed from.

9. **Deliverability (DKIM/SPF)**: DKIM and SPF are managed by the SMTP provider with domain DNS records; the application does not perform DKIM signing.
10. **Localization**: Localization is not supported in this iteration; the system uses a single default language (English, en-US) for all email content.
