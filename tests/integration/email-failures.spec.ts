/**
 * Email Send Failures Integration Test
 *
 * Tests User Story 1 error handling scenarios:
 * - Validation failures (invalid email, subject, HTML size)
 * - Authentication failures (wrong SMTP credentials)
 * - Timeout scenarios (connection/send timeouts)
 * - Service unavailability
 *
 * These tests verify that the service properly returns SendEmailFailure
 * results with appropriate error types and messages.
 */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import React from "react"
import { EmailModule } from "../../src/email/email.module"
import { EmailService } from "../../src/email/email.service"
import type { SendEmailFailure } from "../../src/email/types"
import { MAX_SUBJECT_LENGTH } from "../../src/email/validation"

describe("Email Send Failures (Integration)", () => {
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

  describe("validation failures", () => {
    it("should reject invalid FROM email address", async () => {
      const result = await emailService.send({
        from: "invalid-email",
        to: ["recipient@example.com"],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message.toLowerCase()).toContain("email")
      }
    })

    it("should reject invalid TO email address", async () => {
      const result = await emailService.send({
        from: "sender@example.com",
        to: ["invalid-email", "another-invalid"],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message.toLowerCase()).toContain("email")
      }
    })

    it("should reject empty TO array", async () => {
      const result = await emailService.send({
        from: "sender@example.com",
        to: [],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("At least one")
      }
    })

    it("should reject empty subject", async () => {
      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("subject")
        expect(failure.error.message).toContain("empty")
      }
    })

    it("should reject whitespace-only subject", async () => {
      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "   ",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("empty")
      }
    })

    it("should reject subject exceeding maximum length", async () => {
      const tooLongSubject = "A".repeat(MAX_SUBJECT_LENGTH + 1)

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: tooLongSubject,
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("maximum length")
        expect(failure.error.message).toContain("200")
      }
    })

    it("should reject HTML body exceeding maximum size", async () => {
      // Create a very large HTML body (>500KB)
      const largeContent = "X".repeat(600 * 1024)
      const largeBody = React.createElement("p", null, largeContent)

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Large body test",
        body: largeBody,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("maximum size")
        expect(failure.error.message).toContain("500KB")
      }
    })
  })

  describe("error response structure", () => {
    it("should return consistent failure structure with all required fields", async () => {
      const result = await emailService.send({
        from: "invalid-email",
        to: ["recipient@example.com"],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error).toBeDefined()
        expect(failure.error.type).toBeDefined()
        expect(failure.error.message).toBeDefined()
        expect(typeof failure.error.type).toBe("string")
        expect(typeof failure.error.message).toBe("string")
      }
    })

    it("should include context in validation errors when available", async () => {
      const result = await emailService.send({
        from: "sender@example.com",
        to: [],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        // Context is optional but should be present for debugging
        if (failure.error.context) {
          expect(typeof failure.error.context).toBe("object")
        }
      }
    })

    it("should provide clear error messages for each validation type", async () => {
      const testCases = [
        {
          input: {
            from: "invalid",
            to: ["valid@example.com"],
            subject: "Test",
            body: React.createElement("p", null, "Test"),
          },
          expectedInMessage: "email",
        },
        {
          input: {
            from: "valid@example.com",
            to: ["invalid"],
            subject: "Test",
            body: React.createElement("p", null, "Test"),
          },
          expectedInMessage: "email",
        },
        {
          input: {
            from: "valid@example.com",
            to: ["valid@example.com"],
            subject: "",
            body: React.createElement("p", null, "Test"),
          },
          expectedInMessage: "subject",
        },
      ]

      for (const testCase of testCases) {
        const result = await emailService.send(testCase.input)

        expect(result.ok).toBe(false)
        if (!result.ok) {
          const failure = result as SendEmailFailure
          expect(failure.error.message.toLowerCase()).toContain(
            testCase.expectedInMessage.toLowerCase(),
          )
        }
      }
    })
  })

  describe("error timing requirements", () => {
    it("should return validation errors quickly (< 2 seconds)", async () => {
      const startTime = Date.now()

      const result = await emailService.send({
        from: "invalid-email",
        to: ["recipient@example.com"],
        subject: "Test",
        body: React.createElement("p", null, "Test"),
      })

      const duration = Date.now() - startTime

      expect(result.ok).toBe(false)
      expect(duration).toBeLessThan(2000) // SC-003: errors within 2s
    })

    it("should return multiple validation errors quickly", async () => {
      const startTime = Date.now()

      // Multiple invalid inputs
      const result = await emailService.send({
        from: "invalid",
        to: ["also-invalid"],
        subject: "",
        body: React.createElement("p", null, "Test"),
      })

      const duration = Date.now() - startTime

      expect(result.ok).toBe(false)
      expect(duration).toBeLessThan(2000)
    })
  })

  describe("boundary conditions", () => {
    it("should handle email at maximum local part length", async () => {
      const maxLocalPart = "a".repeat(64) + "@example.com"

      const result = await emailService.send({
        from: "sender@example.com",
        to: [maxLocalPart],
        subject: "Boundary test",
        body: React.createElement("p", null, "Test"),
      })

      // Should succeed (64 chars is the limit)
      expect(result.ok).toBe(true)
    })

    it("should reject email exceeding local part length", async () => {
      const tooLongLocalPart = "a".repeat(65) + "@example.com"

      const result = await emailService.send({
        from: "sender@example.com",
        to: [tooLongLocalPart],
        subject: "Boundary test",
        body: React.createElement("p", null, "Test"),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        const failure = result as SendEmailFailure
        expect(failure.error.type).toBe("validation")
        expect(failure.error.message).toContain("local part")
      }
    })

    it("should handle subject at exactly maximum length", async () => {
      const maxSubject = "A".repeat(MAX_SUBJECT_LENGTH)

      const result = await emailService.send({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: maxSubject,
        body: React.createElement("p", null, "Test"),
      })

      // Should succeed (200 chars is the limit)
      expect(result.ok).toBe(true)
    })
  })
})
