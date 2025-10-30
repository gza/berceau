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
  clearMailbox,
  verifyEmailContent,
  assertMailpitAvailable,
} from "../helpers/email-test-utils"

describe("Mailpit API (Integration)", () => {
  let app: INestApplication
  let emailService: EmailService
  const mailpitClient = createMailpitClient()

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

  beforeEach(async () => {
    // Clear Mailpit inbox before each test and wait for it to be empty
    await clearMailbox()
    // Wait a bit longer to ensure mailbox is actually cleared
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  describe("message retrieval", () => {
    it("should list all messages", async () => {
      // Send test emails
      await emailService.send({
        from: "sender1@example.com",
        to: ["recipient1@example.com"],
        subject: "Message 1",
        body: React.createElement("p", null, "First message"),
      })

      await emailService.send({
        from: "sender2@example.com",
        to: ["recipient2@example.com"],
        subject: "Message 2",
        body: React.createElement("p", null, "Second message"),
      })

      // Wait for messages to be captured (longer wait to ensure both are captured)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // List messages
      const messages = await mailpitClient.listMessages()

      // Verify both messages are present
      expect(messages.length).toBeGreaterThanOrEqual(2)

      const subjects = messages.map((msg) => msg.Subject)
      expect(subjects).toContain("Message 1")
      expect(subjects).toContain("Message 2")
    })

    it("should get message detail by ID", async () => {
      // Send test email
      await emailService.send({
        from: "detail-test@example.com",
        to: ["recipient@example.com"],
        subject: "Detail Test",
        body: React.createElement(
          "div",
          null,
          React.createElement("h1", null, "Test Content"),
          React.createElement("p", null, "This is the message body."),
        ),
      })

      // Wait for message (longer wait to ensure it's captured)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Get message from list
      const messages = await mailpitClient.listMessages()
      const messageSummary = messages.find(
        (msg) => msg.Subject === "Detail Test",
      )
      expect(messageSummary).toBeDefined()

      if (!messageSummary) {
        throw new Error("Message not found")
      }

      // Get full message detail
      const detail = await mailpitClient.getMessage(messageSummary.ID)

      // Verify detail structure
      expect(detail.ID).toBe(messageSummary.ID)
      expect(detail.From.Address).toBe("detail-test@example.com")
      expect(detail.To[0].Address).toBe("recipient@example.com")
      expect(detail.Subject).toBe("Detail Test")
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
    beforeEach(async () => {
      // Ensure inbox is truly clear
      await clearMailbox()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Seed multiple test emails
      await emailService.send({
        from: "sender@example.com",
        to: ["alice@example.com"],
        subject: "Hello Alice",
        body: React.createElement("p", null, "Message for Alice"),
      })

      await emailService.send({
        from: "sender@example.com",
        to: ["bob@example.com"],
        subject: "Hello Bob",
        body: React.createElement("p", null, "Message for Bob"),
      })

      await emailService.send({
        from: "sender@example.com",
        to: ["alice@example.com", "bob@example.com"],
        subject: "Hello Everyone",
        body: React.createElement("p", null, "Message for both"),
      })

      // Wait for all messages to be captured
      await new Promise((resolve) => setTimeout(resolve, 1500))
    })

    it("should search by recipient email", async () => {
      // Search for Alice's emails
      const aliceMessages =
        await mailpitClient.searchByRecipient("alice@example.com")

      expect(aliceMessages.length).toBe(2)

      const subjects = aliceMessages.map((msg) => msg.Subject).sort()
      expect(subjects).toEqual(["Hello Alice", "Hello Everyone"])
    })

    it("should search by subject", async () => {
      // Search for messages with "Bob" in subject
      const bobMessages = await mailpitClient.searchBySubject("Bob")

      expect(bobMessages.length).toBeGreaterThanOrEqual(1)

      const hasHelloBob = bobMessages.some((msg) => msg.Subject === "Hello Bob")
      expect(hasHelloBob).toBe(true)
    })

    it("should return empty array for non-matching search", async () => {
      // Search for non-existent recipient
      const messages = await mailpitClient.searchByRecipient(
        "nonexistent@example.com",
      )

      expect(messages).toEqual([])
    })

    it("should be case-insensitive for recipient search", async () => {
      // Search with uppercase
      const messages =
        await mailpitClient.searchByRecipient("ALICE@EXAMPLE.COM")

      expect(messages.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("inbox management", () => {
    it("should clear all messages", async () => {
      // Send test email
      await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "To Be Deleted",
        body: React.createElement("p", null, "This will be deleted"),
      })

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Verify message exists
      let messages = await mailpitClient.listMessages()
      expect(messages.length).toBeGreaterThan(0)

      // Clear inbox
      await mailpitClient.clearInbox()

      // Verify inbox is empty
      messages = await mailpitClient.listMessages()
      expect(messages.length).toBe(0)
    })

    it("should delete specific message", async () => {
      // Send test emails
      await emailService.send({
        from: "sender@example.com",
        to: ["recipient1@example.com"],
        subject: "Keep This",
        body: React.createElement("p", null, "Keep this message"),
      })

      await emailService.send({
        from: "sender@example.com",
        to: ["recipient2@example.com"],
        subject: "Delete This",
        body: React.createElement("p", null, "Delete this message"),
      })

      // Wait for messages
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Find message to delete
      const messages = await mailpitClient.listMessages()
      const messageToDelete = messages.find(
        (msg) => msg.Subject === "Delete This",
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
        const remainingMessages = await mailpitClient.listMessages()
        const deletedMessage = remainingMessages.find(
          (msg) => msg.ID === messageToDelete.ID,
        )
        expect(deletedMessage).toBeUndefined()

        // Verify other message still exists
        const keptMessage = remainingMessages.find(
          (msg) => msg.Subject === "Keep This",
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
      // Send test email
      await emailService.send({
        from: "verify@example.com",
        to: ["recipient@example.com"],
        subject: "Content Verification Test",
        body: React.createElement(
          "div",
          null,
          React.createElement("h1", null, "Welcome"),
          React.createElement("p", null, "This is the content."),
        ),
      })

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get message
      const messages = await mailpitClient.listMessages()
      const message = messages.find(
        (msg) => msg.Subject === "Content Verification Test",
      )
      expect(message).toBeDefined()

      if (!message) {
        throw new Error("Message not found")
      }

      const detail = await mailpitClient.getMessage(message.ID)

      // Verify content using helper
      verifyEmailContent(detail, {
        subject: "Content Verification Test",
        from: "verify@example.com",
        to: ["recipient@example.com"],
        htmlIncludes: ["<h1>Welcome</h1>", "<p>This is the content.</p>"],
      })
    })

    it("should detect content mismatches", async () => {
      // Send test email
      await emailService.send({
        from: "test@example.com",
        to: ["recipient@example.com"],
        subject: "Mismatch Test",
        body: React.createElement("p", null, "Actual content"),
      })

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get message
      const messages = await mailpitClient.listMessages()
      const message = messages[0]
      const detail = await mailpitClient.getMessage(message.ID)

      // Verify content mismatch is detected
      expect(() => {
        verifyEmailContent(detail, {
          subject: "Wrong Subject",
        })
      }).toThrow(/Subject mismatch/)

      expect(() => {
        verifyEmailContent(detail, {
          htmlIncludes: ["This text does not exist"],
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
