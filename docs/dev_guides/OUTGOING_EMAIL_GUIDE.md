# Outgoing Email Guide

## Overview

This guide shows you how to send HTML emails from your NestJS components using JSX and React server-side rendering. You'll learn how to compose email content inline, render it to HTML, and send it through the EmailService.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Sending Emails from Your Component](#sending-emails-from-your-component)
3. [Creating Email Content with JSX](#creating-email-content-with-jsx)
4. [Email Client Compatibility](#email-client-compatibility)
5. [Supported HTML/CSS Features](#supported-htmlcss-features)
6. [Best Practices](#best-practices)
7. [Image Embedding](#image-embedding)
8. [Testing Your Emails](#testing-your-emails)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Sending Your First Email

```tsx
import { Injectable } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import React from 'react'

@Injectable()
export class UserService {
  constructor(private readonly emailService: EmailService) {}

  async sendWelcomeEmail(user: User) {
    const result = await this.emailService.send({
      from: 'noreply@example.com',
      to: [user.email],
      subject: 'Welcome to Our App!',
      body: (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
          <h1 style={{ color: '#333' }}>Hello, {user.name}!</h1>
          <p style={{ fontSize: '16px' }}>Thanks for signing up!</p>
        </div>
      )
    })

    if (result.ok) {
      console.log('Email sent:', result.messageId)
    } else {
      console.error('Email failed:', result.error)
    }
  }
}
```

---

## Sending Emails from Your Component

### Injecting the EmailService

```tsx
import { Injectable } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import React from 'react'

@Injectable()
export class OrderService {
  constructor(
    private readonly emailService: EmailService
  ) {}

  async notifyOrderConfirmation(order: Order) {
    await this.emailService.send({
      from: 'orders@example.com',
      to: [order.customerEmail],
      subject: `Order #${order.id} Confirmed`,
      body: this.buildOrderEmail(order)
    })
  }

  private buildOrderEmail(order: Order) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <h2>Order Confirmed</h2>
        <p>Order #{order.id}</p>
        <p>Total: ${order.total}</p>
      </div>
    )
  }
}
```

### Using EmailService Methods

```typescript
// Send a single email
const result = await this.emailService.send({
  from: 'noreply@example.com',
  to: ['user@example.com'],
  cc: ['admin@example.com'],      // Optional
  bcc: ['archive@example.com'],    // Optional
  subject: 'Important Update',
  body: emailContent                // React.ReactElement
})

// Check result
if (result.ok) {
  console.log('Sent with ID:', result.messageId)
} else {
  console.error('Failed:', result.error)
}
```

---

## Creating Email Content with JSX

### Inline JSX Creation

For simple emails, create JSX directly in your service methods:

```tsx
async sendPasswordReset(user: User, resetToken: string) {
  const resetUrl = `https://app.example.com/reset?token=${resetToken}`
  
  const emailBody = (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '600px',
      padding: '20px' 
    }}>
      <h1>Password Reset</h1>
      <p>Hi {user.name},</p>
      <p>Click the button below to reset your password:</p>
      <a href={resetUrl} style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '4px'
      }}>
        Reset Password
      </a>
      <p style={{ color: '#666', fontSize: '12px' }}>
        This link expires in 1 hour.
      </p>
    </div>
  )

  await this.emailService.send({
    from: 'security@example.com',
    to: [user.email],
    subject: 'Reset Your Password',
    body: emailBody
  })
}
```

### Extracting Reusable Email Functions

For emails you send frequently, extract them into helper functions:

```tsx
// src/user/email-helpers.tsx
import React from 'react'

export function createWelcomeEmail(userName: string): React.ReactElement {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Welcome, {userName}!</h1>
      <p>Thanks for joining us.</p>
    </div>
  )
}

export function createNotificationEmail(
  title: string, 
  message: string
): React.ReactElement {
  return (
    <div style={{ maxWidth: '600px', padding: '20px' }}>
      <h2 style={{ color: '#333' }}>{title}</h2>
      <p>{message}</p>
    </div>
  )
}

// Use in your service:
await this.emailService.send({
  from: 'noreply@example.com',
  to: [user.email],
  subject: 'Welcome!',
  body: createWelcomeEmail(user.name)
})
```

### Creating React Components (Optional)

For complex emails with lots of logic, create proper React components:

```tsx
// src/order/order-confirmation-email.tsx
import React from 'react'

interface OrderEmailProps {
  orderId: string
  customerName: string
  items: Array<{ name: string; price: number; quantity: number }>
  total: number
}

export const OrderConfirmationEmail: React.FC<OrderEmailProps> = ({
  orderId,
  customerName,
  items,
  total
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px' }}>
      <h1 style={{ color: '#333' }}>Order Confirmed!</h1>
      <p>Hi {customerName},</p>
      <p>Your order #{orderId} has been confirmed.</p>
      
      <table cellPadding={10} cellSpacing={0} style={{ width: '100%', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th>Qty</th>
            <th style={{ textAlign: 'right' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>${item.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 'bold' }}>
            <td colSpan={2}>Total</td>
            <td style={{ textAlign: 'right' }}>${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// Use it:
await this.emailService.send({
  from: 'orders@example.com',
  to: [customer.email],
  subject: `Order #${order.id} Confirmed`,
  body: <OrderConfirmationEmail
    orderId={order.id}
    customerName={customer.name}
    items={order.items}
    total={order.total}
  />
})
```

---

## Email Client Compatibility

Email clients have varying levels of HTML/CSS support. This section documents what works reliably across major clients.

### Major Email Clients

| Client | Market Share | CSS Support | Notes |
|--------|--------------|-------------|-------|
| **Gmail** | ~35% | Good | Strips some styles, use inline |
| **Apple Mail** | ~30% | Excellent | Best CSS support |
| **Outlook (Desktop)** | ~10% | Limited | Use tables for layout |
| **Outlook.com** | ~8% | Good | Similar to Gmail |
| **Yahoo Mail** | ~5% | Good | Inline styles recommended |

### Compatibility Testing Approach

We follow the **"Can I Email"** methodology for validating HTML/CSS features:

1. **Check Feature Support**: Before using a CSS property or HTML element, verify support at [caniemail.com](https://www.caniemail.com/)

2. **Test in Major Clients**: Always test templates in:
   - Gmail (web and mobile)
   - Apple Mail (macOS and iOS)
   - Outlook (Windows desktop)
   - At least one mobile client

3. **Fallback Strategy**: For unsupported features, provide graceful fallbacks:
   ```tsx
   // Good: Fallback font
   style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
   
   // Good: Fallback color
   style={{ backgroundColor: '#007bff' }} // Always use hex
   ```

### Validation Workflow

**Before Deploying a Template:**

1. ✅ Check all CSS properties on [caniemail.com](https://www.caniemail.com/)
2. ✅ Test in Mailpit during development
3. ✅ Send test email to Gmail, Apple Mail, Outlook
4. ✅ Verify mobile rendering on iOS/Android
5. ✅ Check spam score with mail-tester.com

---

## Supported HTML/CSS Features

### ✅ Well-Supported (Use Freely)

#### HTML Elements
- `<div>`, `<p>`, `<span>` - Block and inline containers
- `<h1>` through `<h6>` - Headings
- `<a>` - Links (always use absolute URLs)
- `<img>` - Images (specify width/height)
- `<table>`, `<tr>`, `<td>` - Tables (recommended for layout)
- `<strong>`, `<b>`, `<em>`, `<i>` - Text formatting
- `<ul>`, `<ol>`, `<li>` - Lists

#### CSS Properties
```tsx
// Typography
style={{
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  textAlign: 'center',
  textDecoration: 'underline',
  lineHeight: '1.6'
}}

// Box Model
style={{
  padding: '20px',
  margin: '10px',
  width: '600px',
  height: '100px'
}}

// Background & Borders
style={{
  backgroundColor: '#f0f0f0',
  border: '1px solid #ddd',
  borderRadius: '5px'
}}

// Display
style={{
  display: 'block',      // or 'inline-block'
  textAlign: 'center'
}}
```

### ⚠️ Limited Support (Use with Caution)

```tsx
// Flexbox - Not supported in Outlook, use tables instead
style={{ display: 'flex' }} // ❌ Avoid

// CSS Grid - Not supported in most clients
style={{ display: 'grid' }} // ❌ Avoid

// Position - Limited support
style={{ position: 'absolute' }} // ⚠️ Use sparingly

// Float - Works but tables are better
style={{ float: 'left' }} // ⚠️ Consider tables instead
```

### ❌ Not Supported (Avoid)

- `<style>` tags - Stripped by Gmail and others
- CSS classes - Use inline styles only
- JavaScript - Never works in email
- `<video>`, `<audio>` - Not supported
- `<iframe>` - Security risk, blocked
- Background images - Unreliable, use `<img>` instead
- Custom fonts (@font-face) - Fallback to web-safe fonts

---

## Best Practices

### 1. Always Use Inline Styles

Email clients strip out `<style>` tags and CSS classes, so you must use inline styles for everything.

**❌ Bad:**
```tsx
<div className="email-container">
  <p className="text">Hello</p>
</div>
```

**✅ Good:**
```tsx
<div style={{ maxWidth: '600px', margin: '0 auto' }}>
  <p style={{ color: '#555', fontSize: '16px' }}>Hello</p>
</div>
```

### 2. Use Tables for Multi-Column Layouts

Flexbox and CSS Grid don't work in email clients (especially Outlook). Use tables for any layout that needs columns.

**For multi-column layouts:**

```tsx
<table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
  <tbody>
    <tr>
      <td style={{ width: '50%', padding: '10px' }}>
        Left column
      </td>
      <td style={{ width: '50%', padding: '10px' }}>
        Right column
      </td>
    </tr>
  </tbody>
</table>
```

### 3. Always Specify Image Dimensions

Specify width and height attributes on all images to prevent layout shifts.

**❌ Bad:**
```tsx
<img src="https://example.com/logo.png" alt="Logo" />
```

**✅ Good:**
```tsx
<img 
  src="https://example.com/logo.png" 
  alt="Company Logo"
  width={200}
  height={50}
  style={{ display: 'block' }}
/>
```

### 4. Use Web-Safe Fonts

**Safe Font Stack:**
```tsx
style={{ 
  fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif" 
}}
```

**Web-Safe Fonts:**
- Arial, Helvetica, sans-serif
- 'Times New Roman', Times, serif
- Georgia, serif
- 'Courier New', Courier, monospace
- Verdana, Geneva, sans-serif
- Tahoma, Geneva, sans-serif

### 5. Keep Email Width to 600px

Most email clients work best with emails that are 600px wide. This ensures your email looks good on all devices.

```tsx
<div style={{ maxWidth: '600px', margin: '0 auto' }}>
  {/* Email content here */}
</div>
```

### 6. Use Hex Colors

**❌ Bad:**
```tsx
style={{ color: 'rgb(0, 100, 200)' }}
style={{ color: 'rgba(0, 100, 200, 0.5)' }}
```

**✅ Good:**
```tsx
style={{ color: '#0064c8' }}
```

### 7. Provide Alt Text for Images

Always include descriptive alt text for accessibility and for when images don't load.

```tsx
<img 
  src="https://example.com/icon.png"
  alt="Success icon - checkmark"
  width={24}
  height={24}
/>
```

### 8. Use Absolute URLs

Email clients require absolute URLs for all links and images.

**❌ Bad:**
```tsx
<a href="/dashboard">Dashboard</a>
<img src="/images/logo.png" />
```

**✅ Good:**
```tsx
<a href="https://app.example.com/dashboard">Dashboard</a>
<img src="https://cdn.example.com/images/logo.png" />
```

---

## Image Embedding

### When to Embed Images

**Embed (Base64):**
- ✅ Small logos (<10KB)
- ✅ Icons and buttons
- ✅ Critical branding elements

**External URL:**
- ✅ Large images (>50KB)
- ✅ Photos and screenshots
- ✅ Dynamic content

### How to Embed Images

```tsx
import React from 'react'
import { embedImageForEmail } from '../renderer'

export const EmailWithLogo: React.FC = async () => {
  // Embed small logo as base64
  const logoDataUri = await embedImageForEmail('/path/to/logo.png')
  
  return (
    <div>
      <img 
        src={logoDataUri} 
        alt="Company Logo"
        width={150}
        height={50}
      />
      <p>Welcome!</p>
    </div>
  )
}
```

### Image Size Limits

- **Maximum embedded image**: 100KB
- **Recommended**: <10KB per image
- **Total email size**: Keep under 100KB for best deliverability

---

## Testing Your Emails

### What is Mailpit?

**Mailpit** is an email testing tool that acts as an SMTP server during development and testing. It captures all outgoing emails and provides:

- **Web UI** at http://localhost:8025 to view captured emails
- **SMTP server** on port 1025 for receiving emails
- **REST API** to programmatically query messages

**Benefits:**
- ✅ No real emails sent during development/testing
- ✅ Instant email delivery (no network delays)
- ✅ Visual preview of emails across devices
- ✅ API for automated test verification

### Starting Mailpit

Mailpit is configured in `docker-compose.yml` and starts automatically with other services:

```bash
# Start all services including Mailpit
docker compose up

# Or start only Mailpit
docker compose up mailpit
```

**Verify Mailpit is Running:**

```bash
# Check service status
docker compose ps mailpit

# Check health
curl http://localhost:8025/api/v1/info
```

### Accessing the Web UI

Navigate to: **http://localhost:8025**

**Web UI Features:**

- **Inbox View**: See all captured emails in chronological order (newest first)
- **Message Detail View**: HTML rendering, plain text, raw source, headers, attachments
- **Search and Filter**: Search by recipient, sender, subject; filter by date
- **Mobile Preview**: View email as it appears on different devices

**Manual Testing Workflow:**

1. Send email from your application (dev environment)
2. Check Mailpit at http://localhost:8025
3. Verify email appears, subject is correct, HTML renders properly
4. Test responsiveness using mobile preview
5. Delete test messages when done

### 1. Development Testing with Mailpit

Mailpit captures all emails sent during development so you can preview them without sending real emails.

```bash
# Start Mailpit via Docker Compose
docker compose up -d

# Access web interface
open http://localhost:8025
```

**Send a test email from your service:**

```tsx
@Injectable()
export class UserService {
  constructor(private readonly emailService: EmailService) {}

  async testEmail() {
    const result = await this.emailService.send({
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Email',
      body: (
        <div>
          <h1>Test</h1>
          <p>This is a test email.</p>
        </div>
      )
    })

    console.log('Check Mailpit at http://localhost:8025')
  }
}
```

### 2. Integration Tests (Token-Based)

#### Parallel-Safe Testing Strategy

All Mailpit tests use **token-based isolation** to support parallel execution without race conditions. This eliminates shared state conflicts when multiple test workers access the same Mailpit inbox simultaneously.

**Key Principles:**

1. **No Global Mailbox Operations**: Tests don't clear the entire inbox or rely on global message counts
2. **Unique Test Tokens**: Each test suite generates a unique token embedded in email subjects
3. **Scoped Searches**: Tests only query for emails matching their specific token
4. **Polling-Based Waits**: Use active polling for token-matched emails instead of fixed delays

**Token-Based Isolation Example:**

```typescript
import { generateTestToken, buildSubject } from '../helpers/email-test-utils'

describe('User Email Notifications', () => {
  const TOKEN = generateTestToken() // Unique per suite
  
  it('should send welcome email', async () => {
    // Embed token in subject
    await emailService.send({
      from: 'noreply@example.com',
      to: ['user@example.com'],
      subject: buildSubject('Welcome!', TOKEN), // "Welcome! [t:1761845617448-s86s6i]"
      body: React.createElement('p', null, 'Hello')
    })
    
    // Wait for email matching this token only
    const message = await waitForEmailBySubjectContains(TOKEN)
    expect(message.Subject).toContain('Welcome!')
  })
})
```

**Benefits:**
- Tests run concurrently on 8+ workers without conflicts
- Zero race conditions from shared inbox state
- ~15s runtime with 8 parallel workers
- No `beforeEach` cleanup needed

#### Integration Test Example

Write integration tests to verify your email-sending logic works correctly using token-based isolation for parallel-safe testing:

```tsx
// tests/integration/user-emails.spec.ts
import { Test } from '@nestjs/testing'
import { EmailModule } from '../../src/email/email.module'
import { EmailService } from '../../src/email/email.service'
import { 
  generateTestToken, 
  buildSubject, 
  waitForEmailBySubjectContains,
  getMessageDetail,
  verifyEmailContent 
} from '../helpers/email-test-utils'
import React from 'react'

describe('User Email Notifications', () => {
  const TOKEN = generateTestToken() // Unique per suite
  let emailService: EmailService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile()
    emailService = module.get(EmailService)
  })

  // No beforeEach cleanup needed! ✅

  it('should send welcome email successfully', async () => {
    const userName = 'John Doe'
    const emailBody = (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1>Welcome, {userName}!</h1>
        <p>Thanks for signing up.</p>
      </div>
    )

    const result = await emailService.send({
      from: 'test@example.com',
      to: ['john@example.com'],
      subject: buildSubject('Welcome!', TOKEN), // Embed token
      body: emailBody
    })

    expect(result.ok).toBe(true)
    
    // Wait for email matching this token
    const message = await waitForEmailBySubjectContains(TOKEN)
    expect(message.Subject).toContain('Welcome!')
    
    // Verify content
    const detail = await getMessageDetail(message.ID)
    verifyEmailContent(detail, {
      htmlIncludes: ['Welcome, John Doe!', 'Thanks for signing up.']
    })
  })

  it('should send order confirmation email', async () => {
    const orderId = 'ORD-12345'
    const emailBody = (
      <div>
        <h2>Order Confirmed</h2>
        <p>Order #{orderId} is confirmed</p>
      </div>
    )

    const result = await emailService.send({
      from: 'orders@example.com',
      to: ['customer@example.com'],
      subject: buildSubject(`Order ${orderId} Confirmed`, TOKEN),
      body: emailBody
    })

    expect(result.ok).toBe(true)
    
    // Verify email was captured
    const message = await waitForEmailBySubjectContains(TOKEN)
    expect(message.Subject).toContain(`Order ${orderId} Confirmed`)
  })
})
```

**Key Testing Practices:**
- ✅ Use `generateTestToken()` to create unique tokens per test suite
- ✅ Use `buildSubject()` to embed tokens in email subjects
- ✅ Use `waitForEmailBySubjectContains(TOKEN)` to find your emails
- ✅ No `clearMailbox()` needed - token isolation prevents conflicts
- ✅ Tests can run in parallel without race conditions

### 3. Mailpit API Client

The Mailpit API client provides programmatic access to captured emails for automated testing.

**Import and Use:**

```typescript
import { createMailpitClient } from '../../src/email/testing/mailpit-client'

const mailpitClient = createMailpitClient()
```

**API Methods:**

```typescript
// List all messages
const messages = await mailpitClient.listMessages()

// Get message detail by ID
const detail = await mailpitClient.getMessage(messageId)

// Search by recipient
const messages = await mailpitClient.searchByRecipient('user@example.com')

// Search by subject
const messages = await mailpitClient.searchBySubject('Order Confirmation')

// Clear inbox (avoid in parallel tests)
await mailpitClient.clearInbox()

// Delete specific message
await mailpitClient.deleteMessage(messageId)

// Check availability
const isAvailable = await mailpitClient.isAvailable()
```

### 4. Test Utilities

Test utility functions are located in `tests/helpers/email-test-utils.ts`.

**Token-Based Helpers:**

```typescript
// Generate unique token for test isolation
const TOKEN = generateTestToken()
// Returns: "1761845617448-s86s6i" (timestamp + random string)

// Embed token into email subject
const subject = buildSubject('Welcome Email', TOKEN)
// Returns: "Welcome Email [t:1761845617448-s86s6i]"

// Wait for email matching token
const message = await waitForEmailBySubjectContains(TOKEN, {
  timeoutMs: 5000,
  pollIntervalMs: 100
})

// Find all messages matching token
const messages = await findMessagesBySubjectContains(TOKEN)
```

**Content Verification:**

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

**Legacy Helpers (Still Available):**

```typescript
// Wait for email matching predicate
const message = await waitForEmail(
  (msg) => msg.Subject === 'Order Confirmation' && 
           msg.To[0].Address === 'customer@example.com',
  { timeoutMs: 5000 }
)

// Wait for email to specific recipient
const message = await waitForEmailToRecipient('user@example.com')

// Wait for multiple emails
const [email1, email2] = await waitForEmails([
  (msg) => msg.To[0].Address === 'user1@example.com',
  (msg) => msg.To[0].Address === 'user2@example.com',
])
```

⚠️ **Warning:** Avoid using `clearMailbox()` in parallel tests as it causes race conditions. Use token-based isolation instead.

### 5. Common Testing Patterns

**Pattern 1: Test Email Content**

```typescript
it('should send order confirmation with correct details', async () => {
  const TOKEN = generateTestToken()
  const orderId = '12345'
  const customerEmail = 'customer@example.com'

  await emailService.send({
    from: 'orders@example.com',
    to: [customerEmail],
    subject: buildSubject(`Order ${orderId} Confirmed`, TOKEN),
    body: React.createElement('div', null,
      React.createElement('h1', null, 'Order Confirmed'),
      React.createElement('p', null, `Order #${orderId}`)
    ),
  })

  const message = await waitForEmailBySubjectContains(TOKEN)
  const detail = await getMessageDetail(message.ID)

  verifyEmailContent(detail, {
    subject: buildSubject(`Order ${orderId} Confirmed`, TOKEN),
    from: 'orders@example.com',
    to: [customerEmail],
    htmlIncludes: ['Order Confirmed', `Order #${orderId}`],
  })
})
```

**Pattern 2: Test Multiple Recipients**

```typescript
it('should send email to multiple recipients', async () => {
  const TOKEN = generateTestToken()
  const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com']

  await emailService.send({
    from: 'sender@example.com',
    to: recipients,
    subject: buildSubject('Team Update', TOKEN),
    body: React.createElement('p', null, 'Update for the team'),
  })

  const message = await waitForEmailBySubjectContains(TOKEN)
  const recipientAddresses = message.To.map((addr) => addr.Address)
  expect(recipientAddresses).toEqual(expect.arrayContaining(recipients))
})
```

**Pattern 3: Test Email Failure Handling**

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

**Pattern 4: Test JSX Props Interpolation**

```typescript
it('should interpolate props in JSX email', async () => {
  const TOKEN = generateTestToken()
  const userName = 'Alice'
  const activationCode = 'ABC123'

  await emailService.send({
    from: 'system@example.com',
    to: ['alice@example.com'],
    subject: buildSubject('Account Activation', TOKEN),
    body: React.createElement('div', null,
      React.createElement('p', null, `Hello, ${userName}!`),
      React.createElement('p', null, `Your code: ${activationCode}`)
    ),
  })

  const message = await waitForEmailBySubjectContains(TOKEN)
  const detail = await getMessageDetail(message.ID)

  verifyEmailContent(detail, {
    htmlIncludes: ['Hello, Alice!', 'Your code: ABC123'],
  })
})
```

**Pattern 5: Test Batch Emails**

```typescript
it('should send multiple emails in sequence', async () => {
  const TOKEN = generateTestToken()
  const users = [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ]

  for (const user of users) {
    await emailService.send({
      from: 'noreply@example.com',
      to: [user.email],
      subject: buildSubject(`Hello ${user.name}`, TOKEN),
      body: React.createElement('p', null, `Hi ${user.name}`),
    })
  }

  const messages = await findMessagesBySubjectContains(TOKEN)
  expect(messages.length).toBe(users.length)

  for (const user of users) {
    const userMessage = messages.find(msg => 
      msg.To.some(addr => addr.Address === user.email)
    )
    expect(userMessage).toBeDefined()
  }
})
```

### 6. Testing Troubleshooting

**Mailpit Not Starting:**
- ✅ Ensure Docker is running: `docker ps`
- ✅ Start Mailpit: `docker compose up mailpit`
- ✅ Check logs: `docker compose logs mailpit`
- ✅ Verify port 8025 is not in use: `lsof -i :8025`

**Emails Not Appearing:**
- ✅ Refresh the Mailpit web UI (http://localhost:8025)
- ✅ Check SMTP connection in logs
- ✅ Verify SMTP_HOST=mailpit in `.env`
- ✅ Verify SMTP_PORT=1025 in `.env`

**Test Timeouts:**
- ✅ Increase timeout: `waitForEmailBySubjectContains(TOKEN, { timeoutMs: 10000 })`
- ✅ Check email was actually sent (check logs)
- ✅ Verify token/predicate is correct

**Test Interference:**
- ✅ Use token-based isolation (recommended)
- ✅ Ensure each test suite has a unique token
- ✅ Avoid assertions on global message counts
- ✅ Query only for messages matching your token

**Testing Best Practices:**
- ✅ Use token-based isolation for all parallel tests
- ✅ Generate unique tokens per test suite with `generateTestToken()`
- ✅ Embed tokens in subjects using `buildSubject()`
- ✅ Wait for token-matched emails with `waitForEmailBySubjectContains()`
- ✅ Verify critical content (subject, recipient, key HTML)
- ❌ Don't call `clearMailbox()` in parallel tests - causes race conditions
- ❌ Don't assert on global message counts - use token-filtered counts
- ❌ Don't use sleep() - use polling-based waits

### 7. Visual Testing

**Manual checklist:**
- [ ] Renders correctly in Gmail (web)
- [ ] Renders correctly in Apple Mail (desktop)
- [ ] Renders correctly on iPhone/iPad
- [ ] Renders correctly in Outlook (Windows)
- [ ] All links work
- [ ] All images display
- [ ] Text is readable
- [ ] Colors are correct
- [ ] Layout is responsive

---

## Troubleshooting

### Images Not Displaying

**Problem:** Images show as broken or don't load.

**Solutions:**
1. ✅ Use absolute URLs (https://...)
2. ✅ Specify width and height attributes
3. ✅ Add `style: { display: 'block' }` to avoid spacing issues
4. ✅ Provide meaningful alt text
5. ✅ Check image file is accessible from the internet

### Layout Broken in Outlook

**Problem:** Email layout looks wrong in Outlook desktop.

**Solutions:**
1. ✅ Use tables instead of divs for layout
2. ✅ Set `cellPadding={0}` and `cellSpacing={0}` on tables
3. ✅ Avoid flexbox and grid
4. ✅ Use explicit widths instead of percentages
5. ✅ Add Outlook-specific conditional comments:
   ```tsx
   {/* <!--[if mso]>
   <style>
     table { border-collapse: collapse; }
   </style>
   <![endif]--> */}
   ```

### Styles Not Applied

**Problem:** CSS styles are being stripped.

**Solutions:**
1. ✅ Use inline styles only (no `<style>` tags)
2. ✅ Avoid CSS classes
3. ✅ Use supported CSS properties only
4. ✅ Check [caniemail.com](https://www.caniemail.com/) for property support

### Email Going to Spam

**Problem:** Emails are landing in spam folders.

**Solutions:**
1. ✅ Configure SPF and DKIM records (provider-level)
2. ✅ Use a reputable SMTP provider
3. ✅ Avoid spam trigger words in subject
4. ✅ Keep email size under 100KB
5. ✅ Test with [mail-tester.com](https://www.mail-tester.com/)
6. ✅ Include plain text alternative (future enhancement)
7. ✅ Don't use excessive images or links

### Email Content Not Rendering

**Problem:** Email fails to render or throws an error.

**Solutions:**
1. ✅ Check JSX syntax for errors
2. ✅ Verify all required data is available in scope
3. ✅ Check console/logs for error messages
4. ✅ Test rendering in unit tests:
   ```tsx
   import { renderEmailBody } from '../email/renderer'
   import React from 'react'
   
   const emailBody = (
     <div>
       <h1>Test</h1>
     </div>
   )
   const html = renderEmailBody(emailBody)
   expect(html).toContain('<h1>Test</h1>')
   ```

---

## Additional Resources

### External Tools
- [Can I Email](https://www.caniemail.com/) - Check CSS property support
- [Mail Tester](https://www.mail-tester.com/) - Test spam score
- [HTML Email Check](https://www.htmlemailcheck.com/) - Validate HTML
- [Email on Acid](https://www.emailonacid.com/) - Comprehensive testing (paid)
- [Litmus](https://www.litmus.com/) - Email testing platform (paid)

### Internal Docs
- [Email Implementation](../implementation_doc/OUTGOING_EMAIL_IMPLEMENTATION.md) - Technical implementation details
- [Parallel Test Plan](MAILPIT_PARALLEL_TEST_PLAN.md) - Token-based testing strategy
- [Parallel Test Completion](PARALLEL_TEST_COMPLETION.md) - Implementation completion report

### Integration Tests
The integration tests in `tests/integration/email-*.spec.ts` demonstrate various template patterns, use cases, and parallel-safe testing approaches using token-based isolation.

---

## Summary

**Key Takeaways for Component Developers:**

1. ✅ Inject `EmailService` into your components to send emails
2. ✅ Create email content using TSX/JSX syntax
3. ✅ Always use inline styles (no CSS classes or `<style>` tags)
4. ✅ Use tables for multi-column layouts (flexbox doesn't work)
5. ✅ Test in major email clients (Gmail, Apple Mail, Outlook)
6. ✅ Keep emails under 600px wide and 100KB total
7. ✅ Specify image dimensions explicitly
8. ✅ Use absolute URLs for all links and images
9. ✅ Check [caniemail.com](https://www.caniemail.com/) for CSS support
10. ✅ Test with Mailpit in development (http://localhost:8025)

**Common Use Cases:**

- **Welcome emails**: Send when users sign up
- **Password resets**: Include secure token links
- **Order confirmations**: Display order details in tables
- **Notifications**: Alert users of important events
- **Reports**: Send periodic summaries or updates

**For questions or issues, consult:**
- This guide for email development patterns
- [Implementation docs](../implementation_doc/OUTGOING_EMAIL_IMPLEMENTATION.md) for technical architecture
- Integration tests in `tests/integration/email-templates.spec.ts` for working examples
