# Outgoing Email Guide

**Version**: 1.0  
**Last Updated**: 2025-10-29  

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

### 2. Integration Tests

Write integration tests to verify your email-sending logic works correctly:

```tsx
// tests/integration/user-emails.spec.ts
import { Test } from '@nestjs/testing'
import { EmailModule } from '../../src/email/email.module'
import { EmailService } from '../../src/email/email.service'
import React from 'react'

describe('User Email Notifications', () => {
  let emailService: EmailService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile()
    emailService = module.get(EmailService)
  })

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
      subject: 'Welcome!',
      body: emailBody
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.messageId).toBeDefined()
    }
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
      subject: `Order ${orderId} Confirmed`,
      body: emailBody
    })

    expect(result.ok).toBe(true)
  })
})
```

### 3. Visual Testing

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
- [Email Implementation](../implementation_doc/OUTGOING_EMAIL_IMPLEMENTATION.md) - Technical details

### Integration Tests
The integration tests in `tests/integration/email-templates.spec.ts` demonstrate various template patterns and use cases.

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
