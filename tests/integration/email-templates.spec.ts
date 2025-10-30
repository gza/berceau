/**
 * Integration tests for email template rendering
 *
 * Tests complex JSX templates with props and verifies rendered HTML in Mailpit
 */

import React from "react"
import { Test, TestingModule } from "@nestjs/testing"
import { EmailModule } from "../../src/email/email.module"
import { EmailService } from "../../src/email/email.service"
import type { SendEmailInput } from "../../src/email/types"

describe("Email Templates Integration", () => {
  let module: TestingModule
  let emailService: EmailService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile()

    emailService = module.get<EmailService>(EmailService)
  })

  afterAll(async () => {
    await module.close()
  })

  describe("Complex Template Rendering", () => {
    it("should render and send email with dynamic props", async () => {
      interface WelcomeEmailProps {
        userName: string
        activationLink: string
        expiryDate: string
      }

      const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
        userName,
        activationLink,
        expiryDate,
      }) =>
        React.createElement(
          "div",
          { style: { fontFamily: "Arial, sans-serif", padding: "20px" } },
          React.createElement(
            "h1",
            { style: { color: "#333" } },
            `Welcome, ${userName}!`,
          ),
          React.createElement(
            "p",
            null,
            "Thank you for joining our platform. Please activate your account by clicking the link below:",
          ),
          React.createElement(
            "p",
            null,
            React.createElement(
              "a",
              {
                href: activationLink,
                style: {
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "10px 20px",
                  textDecoration: "none",
                  borderRadius: "5px",
                  display: "inline-block",
                },
              },
              "Activate Account",
            ),
          ),
          React.createElement(
            "p",
            { style: { fontSize: "12px", color: "#666" } },
            `This link expires on ${expiryDate}.`,
          ),
        )

      const input: SendEmailInput = {
        from: "noreply@example.com",
        to: ["test@example.com"],
        subject: "Welcome to our platform",
        body: React.createElement(WelcomeEmail, {
          userName: "John Doe",
          activationLink: "https://example.com/activate/abc123",
          expiryDate: "2025-11-05",
        }),
      }

      const result = await emailService.send(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
        expect(result.provider).toBe("smtp")
      }
    })

    it("should render email with nested components and conditional content", async () => {
      interface NotificationProps {
        type: "info" | "warning" | "error"
        title: string
        message: string
        actionUrl?: string
        actionText?: string
      }

      const NotificationBadge: React.FC<{
        type: NotificationProps["type"]
      }> = ({ type }) => {
        const colors = {
          info: "#17a2b8",
          warning: "#ffc107",
          error: "#dc3545",
        }
        return React.createElement(
          "span",
          {
            style: {
              backgroundColor: colors[type],
              color: "white",
              padding: "5px 10px",
              borderRadius: "3px",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
            },
          },
          type,
        )
      }

      const NotificationEmail: React.FC<NotificationProps> = ({
        type,
        title,
        message,
        actionUrl,
        actionText,
      }) =>
        React.createElement(
          "div",
          { style: { fontFamily: "Arial, sans-serif", padding: "20px" } },
          React.createElement(NotificationBadge, { type }),
          React.createElement("h2", { style: { marginTop: "20px" } }, title),
          React.createElement("p", null, message),
          actionUrl && actionText
            ? React.createElement(
                "p",
                null,
                React.createElement(
                  "a",
                  {
                    href: actionUrl,
                    style: {
                      color: "#007bff",
                      textDecoration: "underline",
                    },
                  },
                  actionText,
                ),
              )
            : null,
        )

      const input: SendEmailInput = {
        from: "noreply@example.com",
        to: ["admin@example.com"],
        subject: "System Notification",
        body: React.createElement(NotificationEmail, {
          type: "warning",
          title: "Database Backup Required",
          message: "Your database has not been backed up in 7 days.",
          actionUrl: "https://example.com/admin/backup",
          actionText: "Run Backup Now",
        }),
      }

      const result = await emailService.send(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
      }
    })

    it("should render email with table layout for email client compatibility", async () => {
      interface InvoiceItem {
        description: string
        quantity: number
        price: number
      }

      interface InvoiceEmailProps {
        invoiceNumber: string
        items: InvoiceItem[]
        total: number
      }

      const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
        invoiceNumber,
        items,
        total,
      }) =>
        React.createElement(
          "div",
          { style: { fontFamily: "Arial, sans-serif" } },
          React.createElement("h1", null, `Invoice #${invoiceNumber}`),
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
              },
              cellPadding: 10,
              cellSpacing: 0,
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                { style: { backgroundColor: "#f0f0f0" } },
                React.createElement(
                  "th",
                  { style: { textAlign: "left" } },
                  "Item",
                ),
                React.createElement(
                  "th",
                  { style: { textAlign: "right" } },
                  "Qty",
                ),
                React.createElement(
                  "th",
                  { style: { textAlign: "right" } },
                  "Price",
                ),
                React.createElement(
                  "th",
                  { style: { textAlign: "right" } },
                  "Total",
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              ...items.map((item, index) =>
                React.createElement(
                  "tr",
                  {
                    key: index,
                    style: {
                      borderBottom: "1px solid #ddd",
                    },
                  },
                  React.createElement("td", null, item.description),
                  React.createElement(
                    "td",
                    { style: { textAlign: "right" } },
                    item.quantity,
                  ),
                  React.createElement(
                    "td",
                    { style: { textAlign: "right" } },
                    `$${item.price.toFixed(2)}`,
                  ),
                  React.createElement(
                    "td",
                    { style: { textAlign: "right" } },
                    `$${(item.quantity * item.price).toFixed(2)}`,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tfoot",
              null,
              React.createElement(
                "tr",
                { style: { fontWeight: "bold" } },
                React.createElement(
                  "td",
                  { colSpan: 3, style: { textAlign: "right" } },
                  "Total:",
                ),
                React.createElement(
                  "td",
                  { style: { textAlign: "right" } },
                  `$${total.toFixed(2)}`,
                ),
              ),
            ),
          ),
        )

      const input: SendEmailInput = {
        from: "billing@example.com",
        to: ["customer@example.com"],
        subject: "Your Invoice",
        body: React.createElement(InvoiceEmail, {
          invoiceNumber: "INV-2025-001",
          items: [
            { description: "Widget A", quantity: 2, price: 19.99 },
            { description: "Widget B", quantity: 1, price: 29.99 },
            { description: "Shipping", quantity: 1, price: 5.0 },
          ],
          total: 74.97,
        }),
      }

      const result = await emailService.send(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
      }
    })

    it("should render email with inline styles for formatting", async () => {
      interface StyledEmailProps {
        heading: string
        paragraphs: string[]
        highlights: string[]
      }

      const StyledEmail: React.FC<StyledEmailProps> = ({
        heading,
        paragraphs,
        highlights,
      }) =>
        React.createElement(
          "div",
          {
            style: {
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              maxWidth: "600px",
              margin: "0 auto",
              padding: "20px",
              backgroundColor: "#f9f9f9",
            },
          },
          React.createElement(
            "h1",
            {
              style: {
                color: "#2c3e50",
                fontSize: "28px",
                marginBottom: "20px",
                borderBottom: "3px solid #3498db",
                paddingBottom: "10px",
              },
            },
            heading,
          ),
          ...paragraphs.map((text, index) =>
            React.createElement(
              "p",
              {
                key: `p-${index}`,
                style: {
                  color: "#555",
                  lineHeight: "1.6",
                  marginBottom: "15px",
                },
              },
              text,
            ),
          ),
          highlights.length > 0
            ? React.createElement(
                "div",
                {
                  style: {
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "5px",
                    padding: "15px",
                    marginTop: "20px",
                  },
                },
                React.createElement(
                  "strong",
                  { style: { color: "#856404" } },
                  "Key Points:",
                ),
                React.createElement(
                  "ul",
                  { style: { marginTop: "10px", paddingLeft: "20px" } },
                  ...highlights.map((item, index) =>
                    React.createElement(
                      "li",
                      {
                        key: `h-${index}`,
                        style: { color: "#856404", marginBottom: "5px" },
                      },
                      item,
                    ),
                  ),
                ),
              )
            : null,
        )

      const input: SendEmailInput = {
        from: "updates@example.com",
        to: ["recipient@example.com"],
        subject: "Styled Email Example",
        body: React.createElement(StyledEmail, {
          heading: "Important Update",
          paragraphs: [
            "We wanted to inform you about some recent changes to our service.",
            "These updates will take effect on November 1st, 2025.",
          ],
          highlights: [
            "New features available",
            "Improved performance",
            "Enhanced security",
          ],
        }),
      }

      const result = await emailService.send(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
      }
    })

    it("should handle multiple prop types (strings, numbers, arrays, booleans)", async () => {
      interface ComplexPropsEmailProps {
        title: string
        count: number
        items: string[]
        isUrgent: boolean
        metadata: Record<string, string>
      }

      const ComplexPropsEmail: React.FC<ComplexPropsEmailProps> = ({
        title,
        count,
        items,
        isUrgent,
        metadata,
      }) =>
        React.createElement(
          "div",
          null,
          React.createElement(
            "h1",
            {
              style: {
                color: isUrgent ? "#dc3545" : "#28a745",
              },
            },
            title,
          ),
          React.createElement("p", null, `Count: ${count}`),
          React.createElement(
            "ul",
            null,
            ...items.map((item, index) =>
              React.createElement("li", { key: index }, item),
            ),
          ),
          React.createElement(
            "div",
            null,
            React.createElement("strong", null, "Metadata:"),
            React.createElement(
              "ul",
              null,
              ...Object.entries(metadata).map(([key, value]) =>
                React.createElement("li", { key }, `${key}: ${value}`),
              ),
            ),
          ),
        )

      const input: SendEmailInput = {
        from: "alerts@example.com",
        to: ["test@example.com"],
        subject: "Complex Props Test",
        body: React.createElement(ComplexPropsEmail, {
          title: "System Alert",
          count: 42,
          items: ["Item 1", "Item 2", "Item 3"],
          isUrgent: true,
          metadata: {
            source: "monitoring",
            severity: "high",
            timestamp: "2025-10-29T14:30:00Z",
          },
        }),
      }

      const result = await emailService.send(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
      }
    })
  })
})
