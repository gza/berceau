/**
 * Unit tests for email error handling
 *
 * Tests the EmailError class factory and proper error type categorization
 * as defined in the feature specification.
 */

import { EmailError } from "../errors"
import type { SendEmailErrorType } from "../types"

describe("EmailError", () => {
  describe("construction", () => {
    it("should create error with type and message", () => {
      const error = new EmailError("validation", "Invalid email address")

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(EmailError)
      expect(error.name).toBe("EmailError")
      expect(error.type).toBe("validation")
      expect(error.message).toBe("Invalid email address")
      expect(error.code).toBeUndefined()
      expect(error.context).toBeUndefined()
    })

    it("should create error with type, message, and code", () => {
      const error = new EmailError("send", "SMTP send failed", "ESMTP_ERROR")

      expect(error.type).toBe("send")
      expect(error.message).toBe("SMTP send failed")
      expect(error.code).toBe("ESMTP_ERROR")
      expect(error.context).toBeUndefined()
    })

    it("should create error with type, message, code, and context", () => {
      const context = { recipient: "redacted@example.com", attempt: 1 }
      const error = new EmailError(
        "timeout",
        "Connection timeout",
        408,
        context,
      )

      expect(error.type).toBe("timeout")
      expect(error.message).toBe("Connection timeout")
      expect(error.code).toBe(408)
      expect(error.context).toEqual(context)
    })

    it("should maintain proper stack trace", () => {
      const error = new EmailError("send", "Test error")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("EmailError")
    })
  })

  describe("error types", () => {
    const errorTypes: Array<{
      type: SendEmailErrorType
      description: string
    }> = [
      { type: "validation", description: "Input validation failed" },
      { type: "render", description: "JSX to HTML rendering failed" },
      { type: "send", description: "SMTP send operation failed" },
      { type: "auth", description: "SMTP authentication failed" },
      { type: "rate_limit", description: "Provider rate limit exceeded" },
      { type: "timeout", description: "Connection or send timeout" },
      { type: "unavailable", description: "SMTP service unavailable" },
    ]

    errorTypes.forEach(({ type, description }) => {
      it(`should support ${type} error type (${description})`, () => {
        const error = new EmailError(type, description)

        expect(error.type).toBe(type)
        expect(error.message).toBe(description)
      })
    })
  })

  describe("error context", () => {
    it("should store arbitrary context without PII", () => {
      const context = {
        provider: "smtp",
        attempt: 3,
        duration_ms: 5000,
        smtp_code: 554,
      }
      const error = new EmailError("send", "Send failed", "554", context)

      expect(error.context).toEqual(context)
    })

    it("should allow empty context object", () => {
      const error = new EmailError("validation", "Invalid input", undefined, {})

      expect(error.context).toEqual({})
    })

    it("should preserve context types", () => {
      const context = {
        isRetryable: true,
        maxRetries: 3,
        timeout: 30000,
      }
      const error = new EmailError("timeout", "Timeout", undefined, context)

      expect(error.context?.isRetryable).toBe(true)
      expect(error.context?.maxRetries).toBe(3)
      expect(error.context?.timeout).toBe(30000)
    })
  })

  describe("error code handling", () => {
    it("should accept string error codes", () => {
      const error = new EmailError("auth", "Auth failed", "AUTH_INVALID")

      expect(error.code).toBe("AUTH_INVALID")
    })

    it("should accept numeric error codes", () => {
      const error = new EmailError("send", "Rejected", 550)

      expect(error.code).toBe(550)
    })

    it("should accept undefined error code", () => {
      const error = new EmailError("validation", "Validation error")

      expect(error.code).toBeUndefined()
    })
  })

  describe("error scenarios", () => {
    it("should create validation error for invalid email", () => {
      const error = new EmailError(
        "validation",
        "Invalid recipient email address",
        undefined,
        { field: "to" },
      )

      expect(error.type).toBe("validation")
      expect(error.context?.field).toBe("to")
    })

    it("should create auth error with SMTP code", () => {
      const error = new EmailError(
        "auth",
        "SMTP authentication failed",
        "535",
        { username: "redacted" },
      )

      expect(error.type).toBe("auth")
      expect(error.code).toBe("535")
    })

    it("should create timeout error with duration", () => {
      const error = new EmailError("timeout", "Send timeout exceeded", 408, {
        timeout_ms: 30000,
        elapsed_ms: 30500,
      })

      expect(error.type).toBe("timeout")
      expect(error.context?.timeout_ms).toBe(30000)
    })

    it("should create render error for JSX failure", () => {
      const error = new EmailError(
        "render",
        "Failed to render JSX to HTML",
        undefined,
        { component: "WelcomeEmail" },
      )

      expect(error.type).toBe("render")
      expect(error.context?.component).toBe("WelcomeEmail")
    })

    it("should create rate_limit error with retry info", () => {
      const error = new EmailError(
        "rate_limit",
        "Provider rate limit exceeded",
        429,
        {
          retry_after_seconds: 60,
          limit: 100,
        },
      )

      expect(error.type).toBe("rate_limit")
      expect(error.code).toBe(429)
      expect(error.context?.retry_after_seconds).toBe(60)
    })

    it("should create unavailable error for service down", () => {
      const error = new EmailError(
        "unavailable",
        "SMTP service unavailable",
        503,
        {
          service: "smtp.example.com",
          port: 587,
        },
      )

      expect(error.type).toBe("unavailable")
      expect(error.code).toBe(503)
    })
  })

  describe("error properties", () => {
    it("should be throwable", () => {
      expect(() => {
        throw new EmailError("send", "Test throw")
      }).toThrow(EmailError)
    })

    it("should be catchable as Error", () => {
      try {
        throw new EmailError("validation", "Test validation")
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect(err).toBeInstanceOf(EmailError)
      }
    })

    it("should preserve error type in catch", () => {
      try {
        throw new EmailError("auth", "Auth error", "AUTH_FAIL")
      } catch (err) {
        if (err instanceof EmailError) {
          expect(err.type).toBe("auth")
          expect(err.code).toBe("AUTH_FAIL")
        } else {
          fail("Should catch as EmailError")
        }
      }
    })
  })
})
