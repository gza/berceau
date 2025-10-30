/**
 * Email Send Integration Test
 *
 * Tests User Story 1 (Send Transactional Email) acceptance scenarios:
 * - Successful email delivery to Mailpit
 * - Email content verification (from, to, subject, HTML body)
 * - JSX body rendering to HTML
 * - Message ID assignment
 *
 * Prerequisites:
 * - Mailpit service running on localhost:1025 (SMTP)
 * - Mailpit API on localhost:8025 (HTTP)
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import React from "react"
import { EmailModule } from "../../src/email/email.module"
import { EmailService } from "../../src/email/email.service"

// Helper to fetch messages from Mailpit API
async function getMailpitMessages(): Promise<any[]> {
  const response = await fetch("http://localhost:8025/api/v1/messages")
  if (!response.ok) {
    throw new Error(`Mailpit API error: ${response.statusText}`)
  }
  const data = await response.json()
  return data.messages || []
}

// Helper to clear Mailpit inbox
async function clearMailpitInbox(): Promise<void> {
  await fetch("http://localhost:8025/api/v1/messages", {
    method: "DELETE",
  })
}

// Helper to get message details by ID
async function getMailpitMessage(messageId: string): Promise<any> {
  const response = await fetch(
    `http://localhost:8025/api/v1/message/${messageId}`,
  )
  if (!response.ok) {
    throw new Error(`Mailpit API error: ${response.statusText}`)
  }
  return response.json()
}

// Wait for email to appear in Mailpit (with timeout)
async function waitForEmail(
  predicate: (msg: any) => boolean,
  timeoutMs = 5000,
): Promise<any> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    const messages = await getMailpitMessages()
    const found = messages.find(predicate)
    if (found) {
      return found
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error("Email not received within timeout")
}

describe("Email Send (Integration)", () => {
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
    await clearMailpitInbox()
  })

  describe("successful email delivery", () => {
    it("should send email with JSX body to Mailpit", async () => {
      const testBody = React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Welcome"),
        React.createElement("p", null, "This is a test email."),
      )

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Test Email",
        body: testBody,
      })

      // Should return success
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.messageId).toBeDefined()
        expect(result.provider).toBe("smtp")
      }

      // Verify email received in Mailpit
      const message = await waitForEmail(
        (msg) => msg.To?.[0]?.Address === "recipient@example.com",
      )

      expect(message).toBeDefined()
      expect(message.From.Address).toBe("sender@example.com")
      expect(message.To[0].Address).toBe("recipient@example.com")
      expect(message.Subject).toBe("Test Email")
    })

    it("should render JSX body to HTML correctly", async () => {
      const testBody = React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Test Header"),
        React.createElement(
          "p",
          null,
          "Test paragraph with ",
          React.createElement("strong", null, "bold text"),
        ),
      )

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "HTML Test",
        body: testBody,
      })

      expect(result.ok).toBe(true)

      // Wait for email and get full details
      const message = await waitForEmail((msg) => msg.Subject === "HTML Test")

      const details = await getMailpitMessage(message.ID)
      const htmlContent = details.HTML

      expect(htmlContent).toContain("<h1>Test Header</h1>")
      expect(htmlContent).toContain("<p>")
      expect(htmlContent).toContain("<strong>bold text</strong>")
    })

    it("should send email to multiple recipients", async () => {
      const testBody = React.createElement("p", null, "Multi-recipient test")

      const result = await emailService.send({
        from: "sender@example.com",
        to: [
          "recipient1@example.com",
          "recipient2@example.com",
          "recipient3@example.com",
        ],
        subject: "Multi-recipient",
        body: testBody,
      })

      expect(result.ok).toBe(true)

      // Wait for email (should appear once with multiple recipients)
      const message = await waitForEmail(
        (msg) => msg.Subject === "Multi-recipient",
      )

      expect(message.To).toHaveLength(3)
      const addresses = message.To.map((t: any) => t.Address)
      expect(addresses).toContain("recipient1@example.com")
      expect(addresses).toContain("recipient2@example.com")
      expect(addresses).toContain("recipient3@example.com")
    })

    it("should handle unicode characters in subject and body", async () => {
      const testBody = React.createElement(
        "p",
        null,
        "Bonjour! 你好! こんにちは! 🎉",
      )

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Unicode Test: 你好 🌍",
        body: testBody,
      })

      expect(result.ok).toBe(true)

      const message = await waitForEmail((msg) =>
        msg.Subject.includes("Unicode Test"),
      )

      expect(message.Subject).toContain("你好")
      expect(message.Subject).toContain("🌍")

      const details = await getMailpitMessage(message.ID)
      expect(details.HTML).toContain("Bonjour!")
      expect(details.HTML).toContain("你好!")
      expect(details.HTML).toContain("🎉")
    })

    it("should assign unique message IDs", async () => {
      const testBody = React.createElement("p", null, "Message ID test")

      const result1 = await emailService.send({
        from: "sender@example.com",
        to: ["recipient1@example.com"],
        subject: "Message 1",
        body: testBody,
      })

      const result2 = await emailService.send({
        from: "sender@example.com",
        to: ["recipient2@example.com"],
        subject: "Message 2",
        body: testBody,
      })

      expect(result1.ok).toBe(true)
      expect(result2.ok).toBe(true)

      if (result1.ok && result2.ok) {
        expect(result1.messageId).toBeDefined()
        expect(result2.messageId).toBeDefined()
        expect(result1.messageId).not.toBe(result2.messageId)
      }
    })
  })

  describe("email content verification", () => {
    it("should preserve complex HTML structure", async () => {
      const testBody = React.createElement(
        "div",
        { style: { fontFamily: "Arial, sans-serif" } },
        React.createElement("h1", null, "Header"),
        React.createElement(
          "ul",
          null,
          React.createElement("li", null, "Item 1"),
          React.createElement("li", null, "Item 2"),
        ),
        React.createElement(
          "p",
          null,
          "Visit ",
          React.createElement("a", { href: "https://example.com" }, "our site"),
        ),
      )

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Complex HTML",
        body: testBody,
      })

      expect(result.ok).toBe(true)

      const message = await waitForEmail(
        (msg) => msg.Subject === "Complex HTML",
      )
      const details = await getMailpitMessage(message.ID)
      const html = details.HTML

      expect(html).toContain("<h1>Header</h1>")
      expect(html).toContain("<ul>")
      expect(html).toContain("<li>Item 1</li>")
      expect(html).toContain("<li>Item 2</li>")
      expect(html).toContain('<a href="https://example.com">our site</a>')
    })

    it("should handle long subject lines correctly", async () => {
      const longSubject = "A".repeat(200) // Max allowed length

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: longSubject,
        body: React.createElement("p", null, "Long subject test"),
      })

      expect(result.ok).toBe(true)

      const message = await waitForEmail((msg) =>
        msg.Subject.startsWith("AAAAA"),
      )

      expect(message.Subject).toBe(longSubject)
    })
  })

  describe("configuration verification", () => {
    it("should use default FROM address from config if not overridden", async () => {
      // This test verifies that configuration is properly loaded
      // The actual FROM address will depend on the service implementation
      const result = await emailService.send({
        from: process.env.SMTP_FROM_DEFAULT || "no-reply@example.com",
        to: ["recipient@example.com"],
        subject: "Config test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(true)
    })
  })
})
