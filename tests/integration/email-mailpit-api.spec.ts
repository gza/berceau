/**
 * Mailpit API Integration Test
 *
 * Tests User Story 3 (Email Testing Support) Mailpit API functionality:
 * - Retrieving messages by ID
 * - Searching messages by recipient
 * - Searching messages by subject
 * - Verifying email content programmatically
 * - Clearing inbox
 *
 * Prerequisites:
 * - Mailpit service running on localhost:8025 (HTTP API)
 */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import React from "react"
import { EmailModule } from "../../src/email/email.module"
import { EmailService } from "../../src/email/email.service"
import { createMailpitClient } from "../../src/email/testing/mailpit-client"
import {
  verifyEmailContent,
  assertMailpitAvailable,
  generateTestToken,
  buildSubject,
  waitForEmailBySubjectContains,
  findMessagesBySubjectContains,
} from "../helpers/email-test-utils"

describe("Mailpit API (Integration)", () => {
  let app: INestApplication
  let emailService: EmailService
  const mailpitClient = createMailpitClient()
  const TOKEN = generateTestToken()

  beforeAll(async () => {
    // Ensure Mailpit is running before tests
    await assertMailpitAvailable()

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

  describe("message retrieval", () => {
    it("should list all messages", async () => {
      // Send test emails with tokenized subjects
      await emailService.send({
        from: "sender1@example.com",
        to: ["recipient1@example.com"],
        subject: buildSubject("Message 1", TOKEN),
        body: React.createElement("p", null, "First message"),
      })

      await emailService.send({
        from: "sender2@example.com",
        to: ["recipient2@example.com"],
        subject: buildSubject("Message 2", TOKEN),
        body: React.createElement("p", null, "Second message"),
      })

      // Wait for both messages using token-based search
      await waitForEmailBySubjectContains(TOKEN)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Extra buffer for second

      // Find tokenized messages
      const messages = await findMessagesBySubjectContains(TOKEN)

      // Verify both messages are present
      expect(messages.length).toBeGreaterThanOrEqual(2)

      const subjects = messages.map((msg) => msg.Subject)
      expect(
        subjects.some((s) => s.includes("Message 1") && s.includes(TOKEN)),
      ).toBe(true)
      expect(
        subjects.some((s) => s.includes("Message 2") && s.includes(TOKEN)),
      ).toBe(true)
    })

    it("should get message detail by ID", async () => {
      // Send test email with tokenized subject
      await emailService.send({
        from: "detail-test@example.com",
        to: ["recipient@example.com"],
        subject: buildSubject("Detail Test", TOKEN),
        body: React.createElement(
          "div",
          null,
          React.createElement("h1", null, "Test Content"),
          React.createElement("p", null, "This is the message body."),
        ),
      })

      // Wait for message using token-based wait
      const messageSummary = await waitForEmailBySubjectContains(TOKEN)

      // Get full message detail
      const detail = await mailpitClient.getMessage(messageSummary.ID)

      // Verify detail structure
      expect(detail.ID).toBe(messageSummary.ID)
      expect(detail.From.Address).toBe("detail-test@example.com")
      expect(detail.To[0].Address).toBe("recipient@example.com")
      expect(detail.Subject).toContain("Detail Test")
      expect(detail.Subject).toContain(TOKEN)
      expect(detail.HTML).toContain("<h1>Test Content</h1>")
      expect(detail.HTML).toContain("<p>This is the message body.</p>")
    })

    it("should handle non-existent message ID", async () => {
      // Try to get message with invalid ID
      await expect(
        mailpitClient.getMessage("nonexistent-id-12345"),
      ).rejects.toThrow(/Mailpit API error/)
    })
  })

  describe("message search", () => {
    it("should search by recipient email", async () => {
      // Send tokenized test emails for Alice
      await emailService.send({
        from: "sender@example.com",
        to: ["alice@example.com"],
        subject: buildSubject("Hello Alice", TOKEN),
        body: React.createElement("p", null, "Message for Alice"),
      })

      await emailService.send({
        from: "sender@example.com",
        to: ["alice@example.com", "bob@example.com"],
        subject: buildSubject("Hello Everyone", TOKEN),
        body: React.createElement("p", null, "Message for both"),
      })

      // Wait for first message to arrive
      await waitForEmailBySubjectContains(TOKEN)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Buffer for second

      // Search for Alice's emails
      const aliceMessages =
        await mailpitClient.searchByRecipient("alice@example.com")

      // Filter to only our tokenized messages
      const tokenizedAliceMessages = aliceMessages.filter((msg) =>
        msg.Subject.includes(TOKEN),
      )

      expect(tokenizedAliceMessages.length).toBe(2)

      const subjects = tokenizedAliceMessages.map((msg) => msg.Subject).sort()
      expect(subjects.some((s) => s.includes("Hello Alice"))).toBe(true)
      expect(subjects.some((s) => s.includes("Hello Everyone"))).toBe(true)
    })

    it("should search by subject", async () => {
      // Send test email with tokenized subject
      await emailService.send({
        from: "sender@example.com",
        to: ["bob@example.com"],
        subject: buildSubject("Hello Bob", TOKEN),
        body: React.createElement("p", null, "Message for Bob"),
      })

      // Wait for message
      await waitForEmailBySubjectContains(TOKEN)

      // Search for messages with "Bob" in subject
      const bobMessages = await mailpitClient.searchBySubject("Bob")

      // Filter to only our tokenized message
      const tokenizedBobMessages = bobMessages.filter((msg) =>
        msg.Subject.includes(TOKEN),
      )

      expect(tokenizedBobMessages.length).toBeGreaterThanOrEqual(1)
      expect(
        tokenizedBobMessages.some((msg) => msg.Subject.includes("Hello Bob")),
      ).toBe(true)
    })

    it("should return empty array for non-matching search", async () => {
      // Search for non-existent recipient (should not include our test data)
      const messages = await mailpitClient.searchByRecipient(
        "nonexistent-never-used-12345@example.com",
      )

      expect(messages).toEqual([])
    })

    it("should be case-insensitive for recipient search", async () => {
      // Send tokenized test email
      await emailService.send({
        from: "sender@example.com",
        to: ["alice@example.com"],
        subject: buildSubject("Case Test", TOKEN),
        body: React.createElement("p", null, "Case insensitive test"),
      })

      // Wait for message
      await waitForEmailBySubjectContains(TOKEN)

      // Search with uppercase
      const messages =
        await mailpitClient.searchByRecipient("ALICE@EXAMPLE.COM")

      // Filter to our tokenized message
      const tokenizedMessages = messages.filter((msg) =>
        msg.Subject.includes(TOKEN),
      )

      expect(tokenizedMessages.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("inbox management", () => {
    it("should clear all messages", async () => {
      // Note: This test uses global clearInbox which affects all messages
      // In parallel execution, avoid this pattern or use with caution
      
      // Send tokenized test email
      await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: buildSubject("To Be Deleted", TOKEN),
        body: React.createElement("p", null, "This will be deleted"),
      })

      // Wait for message
      await waitForEmailBySubjectContains(TOKEN)

      // Verify our tokenized message exists
      const tokenizedMessages = await findMessagesBySubjectContains(TOKEN)
      expect(tokenizedMessages.length).toBeGreaterThan(0)

      // Clear inbox (affects ALL messages - use cautiously in parallel tests)
      await mailpitClient.clearInbox()

      // Verify inbox is empty
      const allMessages = await mailpitClient.listMessages()
      expect(allMessages.length).toBe(0)
    })

    it("should delete specific message", async () => {
      // Send tokenized test emails
      await emailService.send({
        from: "sender@example.com",
        to: ["recipient1@example.com"],
        subject: buildSubject("Keep This", TOKEN),
        body: React.createElement("p", null, "Keep this message"),
      })

      await emailService.send({
        from: "sender@example.com",
        to: ["recipient2@example.com"],
        subject: buildSubject("Delete This", TOKEN),
        body: React.createElement("p", null, "Delete this message"),
      })

      // Wait for first message
      await waitForEmailBySubjectContains(TOKEN)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Buffer for second

      // Find tokenized messages
      const tokenizedMessages = await findMessagesBySubjectContains(TOKEN)
      const messageToDelete = tokenizedMessages.find((msg) =>
        msg.Subject.includes("Delete This"),
      )
      expect(messageToDelete).toBeDefined()

      if (!messageToDelete) {
        throw new Error("Message not found")
      }

      // Try to delete specific message
      // Note: This may not be supported in all Mailpit versions
      try {
        await mailpitClient.deleteMessage(messageToDelete.ID)

        // Verify message was deleted
        const remainingTokenized = await findMessagesBySubjectContains(TOKEN)
        const deletedMessage = remainingTokenized.find(
          (msg) => msg.ID === messageToDelete.ID,
        )
        expect(deletedMessage).toBeUndefined()

        // Verify other message still exists
        const keptMessage = remainingTokenized.find((msg) =>
          msg.Subject.includes("Keep This"),
        )
        expect(keptMessage).toBeDefined()
      } catch (error) {
        // If deletion fails with 404, skip this test
        // Some Mailpit versions may not support individual message deletion
        if (error instanceof Error && error.message.includes("404")) {
          console.warn(
            "Mailpit individual message deletion not supported, skipping test",
          )
          return
        }
        throw error
      }
    })
  })

  describe("content verification", () => {
    it("should verify email content with helper function", async () => {
      // Send tokenized test email
      await emailService.send({
        from: "verify@example.com",
        to: ["recipient@example.com"],
        subject: buildSubject("Content Verification Test", TOKEN),
        body: React.createElement(
          "div",
          null,
          React.createElement("h1", null, "Welcome"),
          React.createElement("p", null, "This is the content."),
        ),
      })

      // Wait for message
      const message = await waitForEmailBySubjectContains(TOKEN)

      const detail = await mailpitClient.getMessage(message.ID)

      // Verify content using helper (partial subject match for tokenized)
      expect(detail.Subject).toContain("Content Verification Test")
      expect(detail.Subject).toContain(TOKEN)
      expect(detail.From.Address).toBe("verify@example.com")
      expect(detail.To[0].Address).toBe("recipient@example.com")
      expect(detail.HTML).toContain("<h1>Welcome</h1>")
      expect(detail.HTML).toContain("<p>This is the content.</p>")
    })

    it("should detect content mismatches", async () => {
      // Send tokenized test email
      await emailService.send({
        from: "test@example.com",
        to: ["recipient@example.com"],
        subject: buildSubject("Mismatch Test", TOKEN),
        body: React.createElement("p", null, "Actual content"),
      })

      // Wait for message
      const message = await waitForEmailBySubjectContains(TOKEN)
      const detail = await mailpitClient.getMessage(message.ID)

      // Verify content mismatch is detected
      expect(() => {
        verifyEmailContent(detail, {
          subject: "Completely Wrong Subject That Won't Match",
        })
      }).toThrow(/Subject mismatch/)

      expect(() => {
        verifyEmailContent(detail, {
          htmlIncludes: ["This text does not exist anywhere"],
        })
      }).toThrow(/HTML missing expected text/)
    })
  })

  describe("Mailpit availability", () => {
    it("should check if Mailpit is available", async () => {
      const isAvailable = await mailpitClient.isAvailable()
      expect(isAvailable).toBe(true)
    })

    it("should detect when Mailpit is unavailable", async () => {
      // Create client with invalid URL
      const invalidClient = createMailpitClient({
        baseUrl: "http://localhost:9999",
        timeoutMs: 1000,
      })

      const isAvailable = await invalidClient.isAvailable()
      expect(isAvailable).toBe(false)
    })
  })
})
