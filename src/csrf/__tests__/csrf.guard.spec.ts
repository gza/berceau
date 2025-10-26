/**
 * Unit Tests for CSRF Guard
 *
 * Feature: 003-provide-an-easy
 * User Story 2: Server-Side Validation
 * Date: 2025-10-26
 *
 * Tests for automatic CSRF validation via NestJS guard.
 * Following TDD approach - these tests are written before implementation.
 */

import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { CsrfGuard } from "../csrf.guard"
import { CsrfService } from "../csrf.service"

describe("CsrfGuard", () => {
  let guard: CsrfGuard
  let service: CsrfService
  let reflector: Reflector

  beforeEach(() => {
    service = new CsrfService()
    reflector = new Reflector()
    guard = new CsrfGuard(service, reflector)
  })

  const createMockExecutionContext = (options: {
    method?: string
    skipCsrf?: boolean
    session?: Record<string, unknown>
    body?: Record<string, unknown>
    headers?: Record<string, string>
    query?: Record<string, unknown>
    path?: string
  }): ExecutionContext => {
    const request = {
      method: options.method || "POST",
      session: options.session,
      body: options.body,
      headers: options.headers,
      query: options.query,
      path: options.path || "/test",
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext
  }

  describe("Safe HTTP Methods (GET, HEAD, OPTIONS)", () => {
    it("should allow GET requests without CSRF token", () => {
      const context = createMockExecutionContext({
        method: "GET",
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should allow HEAD requests without CSRF token", () => {
      const context = createMockExecutionContext({
        method: "HEAD",
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should allow OPTIONS requests without CSRF token", () => {
      const context = createMockExecutionContext({
        method: "OPTIONS",
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })
  })

  describe("Unsafe HTTP Methods (POST, PUT, DELETE, PATCH)", () => {
    it("should reject POST request without token", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "session-token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should reject PUT request without token", () => {
      const context = createMockExecutionContext({
        method: "PUT",
        session: { _csrf: "session-token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should reject DELETE request without token", () => {
      const context = createMockExecutionContext({
        method: "DELETE",
        session: { _csrf: "session-token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should reject PATCH request without token", () => {
      const context = createMockExecutionContext({
        method: "PATCH",
        session: { _csrf: "session-token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should allow POST request with valid token", () => {
      const token = "valid-token-123"
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: token },
        body: { _csrf: token },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should reject POST request with invalid token", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "session-token" },
        body: { _csrf: "wrong-token" },
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should reject POST request without session", () => {
      const context = createMockExecutionContext({
        method: "POST",
        body: { _csrf: "some-token" },
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })
  })

  describe("@SkipCsrf() Decorator", () => {
    it("should allow request when @SkipCsrf() is present on handler", () => {
      const mockGetAllAndOverride = jest.fn().mockReturnValue(true)
      reflector.getAllAndOverride = mockGetAllAndOverride

      const context = createMockExecutionContext({
        method: "POST",
        body: {},
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockGetAllAndOverride).toHaveBeenCalledWith("skipCsrf", [{}, {}])
    })

    it("should validate token when @SkipCsrf() is not present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false)

      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })
  })

  describe("Error Messages", () => {
    it("should throw ForbiddenException with NO_SESSION reason", () => {
      const context = createMockExecutionContext({
        method: "POST",
        body: { _csrf: "token" },
      })

      try {
        guard.canActivate(context)
        fail("Should have thrown ForbiddenException")
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect((error as ForbiddenException).message).toContain("session")
      }
    })

    it("should throw ForbiddenException with NO_SESSION_TOKEN reason", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: {},
        body: { _csrf: "token" },
      })

      try {
        guard.canActivate(context)
        fail("Should have thrown ForbiddenException")
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect((error as ForbiddenException).message).toContain("token")
      }
    })

    it("should throw ForbiddenException with NO_REQUEST_TOKEN reason", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "token" },
        body: {},
      })

      try {
        guard.canActivate(context)
        fail("Should have thrown ForbiddenException")
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect((error as ForbiddenException).message).toContain("CSRF")
      }
    })

    it("should throw ForbiddenException with TOKEN_MISMATCH reason", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "session-token" },
        body: { _csrf: "different-token" },
      })

      try {
        guard.canActivate(context)
        fail("Should have thrown ForbiddenException")
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect((error as ForbiddenException).message).toContain("Invalid")
      }
    })
  })

  describe("Token Extraction Priority", () => {
    it("should accept token from request body", () => {
      const token = "body-token"
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: token },
        body: { _csrf: token },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should accept token from headers", () => {
      const token = "header-token"
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: token },
        headers: { "x-csrf-token": token },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should accept token from query string", () => {
      const token = "query-token"
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: token },
        query: { _csrf: token },
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })
  })

  describe("HTTP Method Case Sensitivity", () => {
    it("should handle lowercase method names", () => {
      const context = createMockExecutionContext({
        method: "get",
      })

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it("should handle uppercase method names", () => {
      const context = createMockExecutionContext({
        method: "POST",
        session: { _csrf: "token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it("should handle mixed case method names", () => {
      const context = createMockExecutionContext({
        method: "Post",
        session: { _csrf: "token" },
        body: {},
      })

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })
  })
})
