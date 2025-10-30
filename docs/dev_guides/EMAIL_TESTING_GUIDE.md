# Email Testing Guide

**Version**: 1.0  
**Last Updated**: 2025-10-29  

## Overview

This guide covers how to test email functionality in development and test environments using Mailpit. You'll learn how to capture emails, access the Mailpit web UI, query the Mailpit API in automated tests, and verify email content programmatically.

## Table of Contents

1. [What is Mailpit?](#what-is-mailpit)
2. [Starting Mailpit](#starting-mailpit)
3. [Accessing the Web UI](#accessing-the-web-ui)
4. [Using Mailpit in Integration Tests](#using-mailpit-in-integration-tests)
5. [Mailpit API Client](#mailpit-api-client)
6. [Test Utilities](#test-utilities)
7. [Common Testing Patterns](#common-testing-patterns)
8. [Troubleshooting](#troubleshooting)

---

## What is Mailpit?

**Mailpit** is an email testing tool that acts as an SMTP server during development and testing. It captures all outgoing emails and provides:

- **Web UI** at http://localhost:8025 to view captured emails
- **SMTP server** on port 1025 for receiving emails
- **REST API** to programmatically query messages

**Benefits:**
- ✅ No real emails sent during development/testing
- ✅ Instant email delivery (no network delays)
- ✅ Visual preview of emails across devices
- ✅ API for automated test verification

---

## Starting Mailpit

### Using Docker Compose (Recommended)

Mailpit is configured in `docker-compose.yml` and starts automatically with other services:

```bash
# Start all services including Mailpit
docker compose up

# Or start only Mailpit
docker compose up mailpit
```

**What this does:**
- Starts Mailpit SMTP server on `localhost:1025`
- Starts Mailpit web UI on `localhost:8025`
- Configures health checks

### Verify Mailpit is Running

```bash
# Check service status
docker compose ps mailpit

# Check health
curl http://localhost:8025/api/v1/info
```

**Expected response:**
```json
{
  "version": "1.x.x",
  "database": "mailpit.db"
}
```

---

## Accessing the Web UI

### Open the Web Interface

Navigate to: **http://localhost:8025**

### Web UI Features

**Inbox View:**
- See all captured emails in chronological order (newest first)
- Quick preview of sender, recipients, subject
- Click any message to view full details

**Message Detail View:**
- HTML rendering (as users see it)
- Plain text version
- Raw source code
- Headers
- Attachments

**Search and Filter:**
- Search by recipient, sender, subject
- Filter by date
- Delete individual messages or clear inbox

**Mobile Preview:**
- View email as it appears on different devices
- Test responsive layouts

### Workflow: Manual Email Testing

1. **Send email** from your application (dev environment)
2. **Check Mailpit** at http://localhost:8025
3. **Verify:**
   - Email appears in inbox
   - Subject is correct
   - Sender/recipients are correct
   - HTML content renders correctly
   - Links work
   - Images display
4. **Test responsiveness** using mobile preview
5. **Delete test messages** when done

---

## Using Mailpit in Integration Tests

### Prerequisites

Before tests run, Jest global setup automatically verifies Mailpit is available (see `jest.globalSetup.ts`). If Mailpit is not running, tests will fail with a clear error message.

### Basic Integration Test

```typescript
// tests/integration/user-emails.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { EmailModule } from '../../src/email/email.module'
import { EmailService } from '../../src/email/email.service'
import {
  waitForEmailToRecipient,
  getMessageDetail,
  clearMailbox,
  verifyEmailContent,
} from '../helpers/email-test-utils'
import React from 'react'

describe('User Email Notifications (Integration)', () => {
  let app: INestApplication
  let emailService: EmailService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    emailService = app.get<EmailService>(EmailService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clear Mailpit inbox before each test
    await clearMailbox()
  })

  it('should send welcome email', async () => {
    // Send email
    const result = await emailService.send({
      from: 'noreply@example.com',
      to: ['user@example.com'],
      subject: 'Welcome!',
      body: React.createElement('div', null, 
        React.createElement('h1', null, 'Welcome!'),
        React.createElement('p', null, 'Thanks for signing up.')
      ),
    })

    expect(result.ok).toBe(true)

    // Wait for email to appear in Mailpit
    const message = await waitForEmailToRecipient('user@example.com')

    // Verify message summary
    expect(message.Subject).toBe('Welcome!')
    expect(message.From.Address).toBe('noreply@example.com')

    // Get full message detail
    const detail = await getMessageDetail(message.ID)

    // Verify content
    verifyEmailContent(detail, {
      subject: 'Welcome!',
      from: 'noreply@example.com',
      to: ['user@example.com'],
      htmlIncludes: ['<h1>Welcome!</h1>', 'Thanks for signing up.'],
    })
  })
})
```

### Test Cleanup

**Always clear the Mailpit inbox before each test:**

```typescript
beforeEach(async () => {
  await clearMailbox()
})
```

This ensures tests are isolated and don't interfere with each other.

---

## Mailpit API Client

### Import and Use

```typescript
import { createMailpitClient } from '../../src/email/testing/mailpit-client'

const mailpitClient = createMailpitClient()
```

### Configuration

```typescript
// Custom configuration (optional)
const mailpitClient = createMailpitClient({
  baseUrl: 'http://localhost:8025', // Default
  timeoutMs: 5000, // Default: 5 seconds
})
```

### API Methods

#### List All Messages

```typescript
const messages = await mailpitClient.listMessages()

// messages[0].ID
// messages[0].Subject
// messages[0].From.Address
// messages[0].To[0].Address
// messages[0].Created (ISO 8601 timestamp)
```

#### Get Message Detail by ID

```typescript
const detail = await mailpitClient.getMessage(messageId)

// detail.HTML - HTML content
// detail.Text - Plain text content
// detail.Subject
// detail.From
// detail.To
// detail.Attachments
```

#### Search by Recipient

```typescript
const messages = await mailpitClient.searchByRecipient('user@example.com')

// Returns all messages sent to user@example.com (in To, Cc, or Bcc)
```

#### Search by Subject

```typescript
const messages = await mailpitClient.searchBySubject('Order Confirmation')

// Returns messages with subject containing "Order Confirmation"
// Case-insensitive partial match
```

#### Clear Inbox

```typescript
await mailpitClient.clearInbox()

// Deletes all messages
```

#### Delete Specific Message

```typescript
await mailpitClient.deleteMessage(messageId)
```

#### Check Availability

```typescript
const isAvailable = await mailpitClient.isAvailable()

// Returns true if Mailpit API is reachable
```

---

## Test Utilities

Test utility functions are located in `tests/helpers/email-test-utils.ts`.

### waitForEmail

Wait for an email matching a predicate to appear in Mailpit.

```typescript
import { waitForEmail } from '../helpers/email-test-utils'

const message = await waitForEmail(
  (msg) => msg.Subject === 'Order Confirmation' && 
           msg.To[0].Address === 'customer@example.com',
  { timeoutMs: 5000 }
)
```

**Options:**
- `timeoutMs` - Maximum wait time (default: 5000ms)
- `pollIntervalMs` - Check interval (default: 100ms)
- `client` - Custom MailpitClient instance

### waitForEmailToRecipient

Convenience function to wait for an email to a specific recipient.

```typescript
import { waitForEmailToRecipient } from '../helpers/email-test-utils'

const message = await waitForEmailToRecipient('user@example.com')
```

### verifyEmailContent

Assert that email content matches expected values.

```typescript
import { verifyEmailContent, getMessageDetail } from '../helpers/email-test-utils'

const detail = await getMessageDetail(message.ID)

verifyEmailContent(detail, {
  subject: 'Welcome!',
  from: 'noreply@example.com',
  to: ['user@example.com'],
  htmlIncludes: ['<h1>Welcome</h1>', '<p>Thanks for signing up</p>'],
  htmlExcludes: ['password', 'secret'],
  textIncludes: ['Welcome', 'Thanks'],
})
```

**Options:**
- `subject` - Expected subject (exact match)
- `from` - Expected sender address
- `to` - Expected recipient addresses
- `htmlIncludes` - Strings that MUST appear in HTML
- `textIncludes` - Strings that MUST appear in plain text
- `htmlExcludes` - Strings that MUST NOT appear in HTML
- `textExcludes` - Strings that MUST NOT appear in plain text

### clearMailbox

Clear all messages from Mailpit inbox.

```typescript
import { clearMailbox } from '../helpers/email-test-utils'

beforeEach(async () => {
  await clearMailbox()
})
```

### assertMailpitAvailable

Assert that Mailpit is reachable. Use in `beforeAll` to fail fast if Mailpit is down.

```typescript
import { assertMailpitAvailable } from '../helpers/email-test-utils'

beforeAll(async () => {
  await assertMailpitAvailable()
})
```

### waitForEmails

Wait for multiple emails matching different predicates.

```typescript
import { waitForEmails } from '../helpers/email-test-utils'

const [email1, email2] = await waitForEmails([
  (msg) => msg.To[0].Address === 'user1@example.com',
  (msg) => msg.To[0].Address === 'user2@example.com',
])
```

---

## Common Testing Patterns

### Pattern 1: Test Email Content

```typescript
it('should send order confirmation with correct details', async () => {
  const orderId = '12345'
  const customerEmail = 'customer@example.com'

  // Send email
  await emailService.send({
    from: 'orders@example.com',
    to: [customerEmail],
    subject: `Order ${orderId} Confirmed`,
    body: React.createElement('div', null,
      React.createElement('h1', null, 'Order Confirmed'),
      React.createElement('p', null, `Order #${orderId}`)
    ),
  })

  // Wait for email
  const message = await waitForEmailToRecipient(customerEmail)
  const detail = await getMessageDetail(message.ID)

  // Verify content
  verifyEmailContent(detail, {
    subject: `Order ${orderId} Confirmed`,
    from: 'orders@example.com',
    to: [customerEmail],
    htmlIncludes: ['Order Confirmed', `Order #${orderId}`],
  })
})
```

### Pattern 2: Test Multiple Recipients

```typescript
it('should send email to multiple recipients', async () => {
  const recipients = [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com',
  ]

  // Send email
  await emailService.send({
    from: 'sender@example.com',
    to: recipients,
    subject: 'Team Update',
    body: React.createElement('p', null, 'Update for the team'),
  })

  // Wait for email (all recipients receive the same message)
  const message = await waitForEmailToRecipient(recipients[0])

  // Verify all recipients are in the message
  const recipientAddresses = message.To.map((addr) => addr.Address)
  expect(recipientAddresses).toEqual(expect.arrayContaining(recipients))
})
```

### Pattern 3: Test Email Failure Handling

```typescript
it('should handle invalid email addresses', async () => {
  const result = await emailService.send({
    from: 'invalid-email', // Invalid format
    to: ['valid@example.com'],
    subject: 'Test',
    body: React.createElement('p', null, 'Test'),
  })

  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error.type).toBe('validation')
    expect(result.error.message).toContain('email')
  }
})
```

### Pattern 4: Test JSX Props Interpolation

```typescript
it('should interpolate props in JSX email', async () => {
  const userName = 'Alice'
  const activationCode = 'ABC123'

  await emailService.send({
    from: 'system@example.com',
    to: ['alice@example.com'],
    subject: 'Account Activation',
    body: React.createElement('div', null,
      React.createElement('p', null, `Hello, ${userName}!`),
      React.createElement('p', null, `Your code: ${activationCode}`)
    ),
  })

  const message = await waitForEmailToRecipient('alice@example.com')
  const detail = await getMessageDetail(message.ID)

  verifyEmailContent(detail, {
    htmlIncludes: ['Hello, Alice!', 'Your code: ABC123'],
  })
})
```

### Pattern 5: Test Batch Emails

```typescript
it('should send multiple emails in sequence', async () => {
  const users = [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ]

  // Send to all users
  for (const user of users) {
    await emailService.send({
      from: 'noreply@example.com',
      to: [user.email],
      subject: `Hello ${user.name}`,
      body: React.createElement('p', null, `Hi ${user.name}`),
    })
  }

  // Verify all emails were sent
  const messages = await mailpitClient.listMessages()
  expect(messages.length).toBeGreaterThanOrEqual(users.length)

  // Verify each user received their email
  for (const user of users) {
    const userMessages = await mailpitClient.searchByRecipient(user.email)
    expect(userMessages.length).toBeGreaterThan(0)
  }
})
```

---

## Troubleshooting

### Mailpit Not Starting

**Symptom:** Tests fail with "Mailpit is not available"

**Solutions:**
1. ✅ Ensure Docker is running: `docker ps`
2. ✅ Start Mailpit: `docker compose up mailpit`
3. ✅ Check logs: `docker compose logs mailpit`
4. ✅ Verify port 8025 is not in use: `lsof -i :8025`

### Emails Not Appearing in Mailpit

**Symptom:** Email sent successfully but doesn't show in Mailpit UI

**Solutions:**
1. ✅ Refresh the Mailpit web UI (http://localhost:8025)
2. ✅ Check SMTP connection in logs
3. ✅ Verify SMTP_HOST=mailpit in `.env`
4. ✅ Verify SMTP_PORT=1025 in `.env`
5. ✅ Check Docker network connectivity

### Test Timeouts

**Symptom:** `waitForEmail` times out

**Solutions:**
1. ✅ Increase timeout: `waitForEmail(predicate, { timeoutMs: 10000 })`
2. ✅ Check email was actually sent (check logs)
3. ✅ Verify predicate is correct (log messages to debug)
4. ✅ Ensure inbox was cleared before test: `clearMailbox()`

### Test Interference

**Symptom:** Tests pass individually but fail when run together

**Solutions:**
1. ✅ Clear inbox before each test:
   ```typescript
   beforeEach(async () => {
     await clearMailbox()
   })
   ```
2. ✅ Use unique recipient addresses per test
3. ✅ Use unique subjects per test
4. ✅ Avoid shared state between tests

### Mailpit API Errors

**Symptom:** API calls fail with 404 or timeout

**Solutions:**
1. ✅ Verify Mailpit is running: `curl http://localhost:8025/api/v1/info`
2. ✅ Check Docker network configuration
3. ✅ Restart Mailpit: `docker compose restart mailpit`
4. ✅ Check firewall/port blocking

### Performance Issues

**Symptom:** Tests are slow

**Solutions:**
1. ✅ Use shorter poll intervals: `pollIntervalMs: 50`
2. ✅ Reduce timeouts for faster failures
3. ✅ Clear inbox regularly to reduce query time
4. ✅ Limit number of test emails per test

---

## Best Practices

### ✅ DO

- **Clear inbox before each test** to prevent interference
- **Use descriptive subjects** to make tests easier to debug
- **Wait for specific emails** instead of sleeping
- **Verify critical content** (subject, recipient, key HTML)
- **Use helper functions** (`waitForEmailToRecipient`, `verifyEmailContent`)
- **Test both success and failure cases**
- **Use unique recipients** per test when possible

### ❌ DON'T

- **Don't skip inbox cleanup** - leads to flaky tests
- **Don't use sleep()** - use `waitForEmail()` instead
- **Don't test visual appearance** in integration tests (use manual testing)
- **Don't hardcode message IDs** - query by recipient/subject
- **Don't ignore test failures** - fix or update expectations
- **Don't send real emails in tests** - always use Mailpit

---

## Additional Resources

- **Mailpit Documentation**: https://mailpit.axllent.org/
- **Mailpit API Reference**: https://mailpit.axllent.org/docs/api-v1/
- **Email Testing Best Practices**: See `OUTGOING_EMAIL_GUIDE.md`
- **Integration Test Examples**: See `tests/integration/email-*.spec.ts`

---

## Summary

Mailpit provides a reliable way to test email functionality without sending real emails. Key points:

1. **Start Mailpit** with `docker compose up`
2. **Access web UI** at http://localhost:8025
3. **Use test utilities** (`waitForEmail`, `verifyEmailContent`, `clearMailbox`)
4. **Clear inbox** before each test
5. **Verify content** programmatically in tests
6. **Debug visually** in web UI when needed

For more information on sending emails, see `OUTGOING_EMAIL_GUIDE.md`.
