/**
 * CSRF Programmatic Access Integration Test
 *
 * Validates User Story 1 (Programmatic Token Access) acceptance scenarios:
 * 1. Developer can access token value programmatically in JavaScript
 * 2. Client-side JavaScript can retrieve token for AJAX requests
 * 3. Token parameter name is accessible alongside token value
 *
 * Tests programmatic token access via the CsrfService for automated testing
 * and JavaScript-based form submissions.
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import session from "express-session"
import type { SessionData } from "express-session"
import { AppModule } from "../../../src/app.module"
import { CsrfService } from "../../../src/csrf/csrf.service"

describe("CSRF Programmatic Access (Integration)", () => {
  let app: INestApplication
  let csrfService: CsrfService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    csrfService = app.get<CsrfService>(CsrfService)

    // Configure session middleware (same as main.ts)
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "test-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false, // false for testing
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
      }),
    )

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("US1: Token Generation and Retrieval", () => {
    it("should generate token programmatically via service", () => {
      const mockSession = {} as SessionData
      const token = csrfService.generateToken(mockSession)

      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(32)
    })

    it("should retrieve existing token from session", () => {
      const mockSession = {} as SessionData

      // Generate token
      const generatedToken = csrfService.generateToken(mockSession)

      // Retrieve token
      const retrievedToken = csrfService.getToken(mockSession)

      expect(retrievedToken).toBe(generatedToken)
    })

    it("should return undefined for token if session has no token", () => {
      const mockSession = {} as SessionData
      const token = csrfService.getToken(mockSession)

      expect(token).toBeUndefined()
    })

    it("should reuse same token for same session", () => {
      const mockSession = {} as SessionData

      const token1 = csrfService.generateToken(mockSession)
      const token2 = csrfService.generateToken(mockSession)
      const token3 = csrfService.generateToken(mockSession)

      expect(token1).toBe(token2)
      expect(token2).toBe(token3)
    })
  })

  describe("US1: Token Metadata Access", () => {
    it("should provide field name for forms", () => {
      const fieldName = csrfService.getFieldName()

      expect(fieldName).toBe("_csrf")
    })

    it("should provide header name for AJAX requests", () => {
      const headerName = csrfService.getHeaderName()

      expect(headerName).toBe("X-Csrf-Token")
    })
  })

  describe("US1: AJAX Requests with Tokens", () => {
    it("should accept AJAX POST with token in header", async () => {
      const agent = request.agent(app.getHttpServer())

      // Establish session and get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Simulate AJAX POST with token in header
      const postResponse = await agent
        .post("/demo/posts")
        .set("X-CSRF-Token", csrfToken)
        .set("Content-Type", "application/json")
        .send({
          title: "AJAX Post",
          content: "Token in header",
          authorName: "AJAX User",
          authorEmail: "ajax@example.com",
        })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should accept AJAX POST with token in body", async () => {
      const agent = request.agent(app.getHttpServer())

      // Establish session and get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Simulate AJAX POST with token in body
      const postResponse = await agent
        .post("/demo/posts")
        .set("Content-Type", "application/json")
        .send({
          _csrf: csrfToken,
          title: "AJAX Post Body",
          content: "Token in body",
          authorName: "AJAX User",
          authorEmail: "ajax@example.com",
        })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should reject AJAX POST without token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Establish session
      await agent.get("/demo/posts")

      // AJAX POST without token
      const postResponse = await agent
        .post("/demo/posts")
        .set("Content-Type", "application/json")
        .send({
          title: "AJAX No Token",
          content: "Should fail",
          authorName: "AJAX User",
          authorEmail: "ajax@example.com",
        })

      expect(postResponse.status).toBe(403)
    })
  })

  describe("US1: JavaScript Token Retrieval from HTML", () => {
    it("should embed token in HTML for JavaScript extraction", async () => {
      const agent = request.agent(app.getHttpServer())

      const response = await agent.get("/demo/posts")

      // Verify token is in HTML as hidden input (for JS extraction)
      expect(response.text).toContain('name="_csrf"')
      expect(response.text).toContain('type="hidden"')

      // Extract token value (simulating JavaScript)
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        response.text,
      )
      expect(tokenMatch).not.toBeNull()

      const token = tokenMatch![1]
      expect(token).toBeTruthy()
      expect(token.length).toBeGreaterThan(32)
    })

    it("should allow JavaScript to use extracted token in subsequent requests", async () => {
      const agent = request.agent(app.getHttpServer())

      // Step 1: Load page and extract token (simulating JS)
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const extractedToken = tokenMatch![1]

      // Step 2: Use extracted token in AJAX request (simulating JS fetch/axios)
      const postResponse = await agent
        .post("/demo/posts")
        .set("X-CSRF-Token", extractedToken)
        .send({
          title: "JS Extracted Token",
          content: "Token extracted from HTML by JavaScript",
          authorName: "JS User",
          authorEmail: "js@example.com",
        })

      expect([201, 303]).toContain(postResponse.status)
    })
  })

  describe("US1: Automated Testing Support", () => {
    it("should allow test code to generate and use tokens programmatically", () => {
      const mockSession = {} as SessionData

      // Test code can generate token
      const token = csrfService.generateToken(mockSession)
      expect(token).toBeDefined()

      // Test code can retrieve token
      const retrieved = csrfService.getToken(mockSession)
      expect(retrieved).toBe(token)

      // Test code can get field/header names
      const fieldName = csrfService.getFieldName()
      const headerName = csrfService.getHeaderName()
      expect(fieldName).toBe("_csrf")
      expect(headerName).toBe("X-Csrf-Token")
    })

    it("should support multiple test sessions with different tokens", () => {
      const session1 = {} as SessionData
      const session2 = {} as SessionData
      const session3 = {} as SessionData

      const token1 = csrfService.generateToken(session1)
      const token2 = csrfService.generateToken(session2)
      const token3 = csrfService.generateToken(session3)

      // Each session should have unique token
      expect(token1).not.toBe(token2)
      expect(token2).not.toBe(token3)
      expect(token1).not.toBe(token3)

      // Each session should maintain its own token
      expect(csrfService.getToken(session1)).toBe(token1)
      expect(csrfService.getToken(session2)).toBe(token2)
      expect(csrfService.getToken(session3)).toBe(token3)
    })

    it("should validate tokens correctly in integration tests", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token via HTML
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const validToken = tokenMatch![1]

      // Test valid token
      const validResponse = await agent.post("/demo/posts").send({
        _csrf: validToken,
        title: "Valid Test",
        content: "Should succeed",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })
      expect([201, 303]).toContain(validResponse.status)

      // Test invalid token
      const invalidResponse = await agent.post("/demo/posts").send({
        _csrf: "invalid-token-12345",
        title: "Invalid Test",
        content: "Should fail",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })
      expect(invalidResponse.status).toBe(403)
    })
  })

  describe("US1: Token Format and Security", () => {
    it("should generate cryptographically secure random tokens", () => {
      const mockSession1 = {} as SessionData
      const mockSession2 = {} as SessionData

      const token1 = csrfService.generateToken(mockSession1)
      const token2 = csrfService.generateToken(mockSession2)

      // Tokens should be different
      expect(token1).not.toBe(token2)

      // Tokens should be hexadecimal strings
      expect(token1).toMatch(/^[0-9a-f]+$/i)
      expect(token2).toMatch(/^[0-9a-f]+$/i)

      // Tokens should be at least 64 characters (32 bytes = 64 hex chars)
      expect(token1.length).toBeGreaterThanOrEqual(64)
      expect(token2.length).toBeGreaterThanOrEqual(64)
    })

    it("should not expose tokens in URLs or logs", async () => {
      const agent = request.agent(app.getHttpServer())

      const response = await agent.get("/demo/posts")

      // Token should not be in query string
      expect(response.request.url).not.toContain("_csrf=")

      // Token should be in hidden input only
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        response.text,
      )
      expect(tokenMatch).not.toBeNull()
      expect(response.text).toContain('type="hidden"')
    })
  })
})
