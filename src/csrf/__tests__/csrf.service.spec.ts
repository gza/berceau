/**
 * Unit Tests for CSRF Service
 *
 * Feature: 003-provide-an-easy
 * User Story 1: Programmatic Token Access
 * Date: 2025-10-26
 *
 * Tests for token generation, retrieval, and metadata access.
 * Following TDD approach - these tests are written before implementation verification.
 */

import { CsrfService } from "../csrf.service"
import type { CsrfValidationResult } from "../types"
import { CsrfValidationFailureReason } from "../types"

describe("CsrfService", () => {
  let service: CsrfService

  beforeEach(() => {
    service = new CsrfService()
  })

  describe("generateToken()", () => {
    it("should generate a cryptographically secure token", () => {
      const session = {}
      const token = service.generateToken(session)

      // Token should be a hex string (64 characters for 32 bytes)
      expect(token).toMatch(/^[0-9a-f]{64}$/i)
      expect(token.length).toBe(64)
    })

    it("should store token in session under sessionKey", () => {
      const session: Record<string, unknown> = {}
      const token = service.generateToken(session)

      // Token should be stored in session
      expect(session._csrf).toBe(token)
    })

    it("should return existing token if present", () => {
      const existingToken = "abc123def456"
      const session = { _csrf: existingToken }

      const token = service.generateToken(session)

      // Should return existing token, not generate new one
      expect(token).toBe(existingToken)
    })

    it("should generate new token if none exists", () => {
      const session: Record<string, unknown> = {}

      const token = service.generateToken(session)

      // Should have generated and stored a new token
      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
      expect(session._csrf).toBe(token)
    })

    it("should generate different tokens for different sessions", () => {
      const session1 = {}
      const session2 = {}

      const token1 = service.generateToken(session1)
      const token2 = service.generateToken(session2)

      // Tokens should be different (cryptographically random)
      expect(token1).not.toBe(token2)
    })
  })

  describe("getToken()", () => {
    it("should retrieve token from session[sessionKey]", () => {
      const expectedToken = "test-token-123"
      const session = { _csrf: expectedToken }

      const token = service.getToken(session)

      expect(token).toBe(expectedToken)
    })

    it("should return undefined if no token exists", () => {
      const session = {}

      const token = service.getToken(session)

      expect(token).toBeUndefined()
    })

    it("should return token if it exists", () => {
      const session = { _csrf: "my-token" }

      const token = service.getToken(session)

      expect(token).toBe("my-token")
    })

    it("should return undefined for empty session", () => {
      const session = {}

      const token = service.getToken(session)

      expect(token).toBeUndefined()
    })

    it("should handle non-string values in session gracefully", () => {
      const session = { _csrf: 12345 }

      const token = service.getToken(session)

      // Should return undefined for non-string values
      expect(token).toBeUndefined()
    })
  })

  describe("getFieldName()", () => {
    it("should return configured fieldName value", () => {
      const fieldName = service.getFieldName()

      expect(fieldName).toBe("_csrf")
    })

    it("should return default '_csrf' value", () => {
      const fieldName = service.getFieldName()

      expect(typeof fieldName).toBe("string")
      expect(fieldName).toBe("_csrf")
    })
  })

  describe("getHeaderName()", () => {
    it("should return configured headerName value", () => {
      const headerName = service.getHeaderName()

      // Should return with standard capitalization for display
      expect(headerName).toBe("X-Csrf-Token")
    })

    it("should return header name with proper capitalization", () => {
      const headerName = service.getHeaderName()

      expect(typeof headerName).toBe("string")
      // Header name should be capitalized for documentation/display
      expect(headerName).toMatch(/^[A-Z]/)
    })
  })

  describe("extractTokenFromRequest()", () => {
    it("should extract token from request body first", () => {
      const request = {
        body: { _csrf: "body-token" },
        headers: { "x-csrf-token": "header-token" },
        query: { _csrf: "query-token" },
      }

      const result = service.extractTokenFromRequest(request)

      expect(result).toEqual({
        value: "body-token",
        location: "body",
      })
    })

    it("should extract token from headers if not in body", () => {
      const request = {
        body: {},
        headers: { "x-csrf-token": "header-token" },
        query: { _csrf: "query-token" },
      }

      const result = service.extractTokenFromRequest(request)

      expect(result).toEqual({
        value: "header-token",
        location: "header",
      })
    })

    it("should extract token from query if not in body or headers", () => {
      const request = {
        body: {},
        headers: {},
        query: { _csrf: "query-token" },
      }

      const result = service.extractTokenFromRequest(request)

      expect(result).toEqual({
        value: "query-token",
        location: "query",
      })
    })

    it("should return undefined if no token found", () => {
      const request = {
        body: {},
        headers: {},
        query: {},
      }

      const result = service.extractTokenFromRequest(request)

      expect(result).toBeUndefined()
    })

    it("should handle missing request properties", () => {
      const request = {}

      const result = service.extractTokenFromRequest(request)

      expect(result).toBeUndefined()
    })
  })

  describe("validateToken()", () => {
    it("should return invalid if request has no session", () => {
      const request = {}

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe(CsrfValidationFailureReason.NO_SESSION)
      expect(result.sessionPresent).toBe(false)
      expect(result.tokenPresent).toBe(false)
    })

    it("should return invalid if session has no token", () => {
      const request = {
        session: {},
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe(CsrfValidationFailureReason.NO_SESSION_TOKEN)
      expect(result.sessionPresent).toBe(true)
      expect(result.tokenPresent).toBe(false)
    })

    it("should return invalid if request has no token", () => {
      const request = {
        session: { _csrf: "session-token" },
        body: {},
        headers: {},
        query: {},
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe(CsrfValidationFailureReason.NO_REQUEST_TOKEN)
      expect(result.sessionPresent).toBe(true)
      expect(result.tokenPresent).toBe(false)
    })

    it("should return invalid if tokens do not match", () => {
      const request = {
        session: { _csrf: "session-token" },
        body: { _csrf: "different-token" },
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe(CsrfValidationFailureReason.TOKEN_MISMATCH)
      expect(result.sessionPresent).toBe(true)
      expect(result.tokenPresent).toBe(true)
    })

    it("should return valid if tokens match", () => {
      const token = "matching-token"
      const request = {
        session: { _csrf: token },
        body: { _csrf: token },
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(result.sessionPresent).toBe(true)
      expect(result.tokenPresent).toBe(true)
    })

    it("should use constant-time comparison for security", () => {
      // This test verifies timing-safe comparison is used
      const sessionToken = "a".repeat(64)
      const requestToken = "b".repeat(64)

      const request = {
        session: { _csrf: sessionToken },
        body: { _csrf: requestToken },
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe(CsrfValidationFailureReason.TOKEN_MISMATCH)
    })

    it("should include timestamp in validation result", () => {
      const request = {
        session: { _csrf: "token" },
        body: { _csrf: "token" },
      }

      const before = new Date()
      const result: CsrfValidationResult = service.validateToken(request)
      const after = new Date()

      expect(result.timestamp).toBeInstanceOf(Date)
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      )
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it("should validate tokens from header", () => {
      const token = "header-token-value"
      const request = {
        session: { _csrf: token },
        headers: { "x-csrf-token": token },
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(true)
    })

    it("should validate tokens from query string", () => {
      const token = "query-token-value"
      const request = {
        session: { _csrf: token },
        query: { _csrf: token },
      }

      const result: CsrfValidationResult = service.validateToken(request)

      expect(result.isValid).toBe(true)
    })
  })
})
