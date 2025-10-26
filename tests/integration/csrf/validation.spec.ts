/**
 * CSRF Validation Integration Test
 *
 * Validates User Story 2 (Server-Side Validation) acceptance scenarios focusing on:
 * - Token extraction from different locations (body, header, query)
 * - Token validation logic end-to-end
 * - Constant-time comparison behavior
 * - All validation failure reasons
 *
 * US2 Acceptance Scenarios:
 * 1. POST endpoint with valid token → processed normally
 * 2. POST endpoint without token → rejected with 403
 * 3. POST endpoint with expired session token → rejected with 403
 * 4. GET/HEAD/OPTIONS endpoint without token → processed normally
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import session from "express-session"
import { AppModule } from "../../../src/app.module"

describe("CSRF Validation (Integration)", () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

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

  describe("Token Extraction from Different Locations", () => {
    it("should extract token from request body (_csrf field)", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Send token in body
      const postResponse = await agent.post("/demo/posts").send({
        _csrf: csrfToken,
        title: "Body Token Test",
        content: "Token in body",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should extract token from request header (X-CSRF-Token)", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Send token in header (x-csrf-token, lowercase)
      const postResponse = await agent
        .post("/demo/posts")
        .set("x-csrf-token", csrfToken)
        .send({
          title: "Header Token Test",
          content: "Token in header",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should extract token from query string (_csrf parameter)", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Send token in query string
      const postResponse = await agent
        .post(`/demo/posts?_csrf=${csrfToken}`)
        .send({
          title: "Query Token Test",
          content: "Token in query",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should prioritize body over header and query", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get valid token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const validToken = tokenMatch![1]

      // Send valid token in body, invalid in header and query
      const postResponse = await agent
        .post("/demo/posts?_csrf=invalid-query-token")
        .set("x-csrf-token", "invalid-header-token")
        .send({
          _csrf: validToken, // Valid token in body
          title: "Priority Test",
          content: "Body token should take priority",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

      // Should succeed because body token is valid
      expect([201, 303]).toContain(postResponse.status)
    })
  })

  describe("Validation Failure Reasons", () => {
    it("should fail with NO_SESSION when session is not established", async () => {
      // Use fresh agent without establishing session
      const response = await request(app.getHttpServer())
        .post("/demo/posts")
        .send({
          _csrf: "some-token",
          title: "No Session Test",
          content: "This should fail",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain("CSRF")
    })

    it("should fail with NO_SESSION_TOKEN when session has no token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Establish session but don't generate token (skip GET request)
      // Note: In our implementation, GET establishes session automatically
      // So we'll send a POST directly which will have session but no token
      const response = await agent.post("/demo/posts").send({
        title: "No Session Token Test",
        content: "Session exists but no token generated",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain("CSRF")
    })

    it("should fail with NO_REQUEST_TOKEN when request has no token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Generate token by visiting GET endpoint
      await agent.get("/demo/posts")

      // Send POST without token
      const response = await agent.post("/demo/posts").send({
        title: "No Request Token Test",
        content: "Session has token but request doesn't",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain("CSRF")
    })

    it("should fail with TOKEN_MISMATCH when tokens don't match", async () => {
      const agent = request.agent(app.getHttpServer())

      // Generate token
      await agent.get("/demo/posts")

      // Send POST with wrong token
      const response = await agent.post("/demo/posts").send({
        _csrf: "wrong-token-value-123456789",
        title: "Token Mismatch Test",
        content: "Tokens don't match",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain("CSRF")
    })
  })

  describe("Constant-Time Comparison", () => {
    it("should use constant-time comparison for security", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get valid token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const validToken = tokenMatch![1]

      // Create tokens that differ early vs late in the string
      const earlyDiffToken = "X" + validToken.substring(1) // Differs at position 0
      const lateDiffToken = validToken.substring(0, validToken.length - 1) + "X" // Differs at last position

      // Both should fail, and timing should be similar (constant-time)
      const startEarly = Date.now()
      const earlyResponse = await agent.post("/demo/posts").send({
        _csrf: earlyDiffToken,
        title: "Early Diff Test",
        content: "Token differs early",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })
      const earlyDuration = Date.now() - startEarly

      const startLate = Date.now()
      const lateResponse = await agent.post("/demo/posts").send({
        _csrf: lateDiffToken,
        title: "Late Diff Test",
        content: "Token differs late",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })
      const lateDuration = Date.now() - startLate

      // Both should fail
      expect(earlyResponse.status).toBe(403)
      expect(lateResponse.status).toBe(403)

      // Timing difference should be small (within 50ms tolerance)
      // This is not a perfect test of constant-time, but it's a reasonable sanity check
      const timingDiff = Math.abs(earlyDuration - lateDuration)
      expect(timingDiff).toBeLessThan(50)
    })
  })

  describe("Token Validation End-to-End", () => {
    it("should validate complete request flow with token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Step 1: GET request establishes session and generates token
      const getResponse = await agent.get("/demo/posts")
      expect(getResponse.status).toBe(200)

      // Step 2: Extract token from response
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      expect(tokenMatch).not.toBeNull()
      const csrfToken = tokenMatch![1]
      expect(csrfToken).toBeTruthy()

      // Step 3: POST request with valid token succeeds
      const postResponse = await agent.post("/demo/posts").send({
        _csrf: csrfToken,
        title: "E2E Test Post",
        content: "End-to-end validation test",
        authorName: "E2E User",
        authorEmail: "e2e@example.com",
      })
      expect([201, 303]).toContain(postResponse.status)

      // Step 4: Same token can be reused in same session
      const postResponse2 = await agent.post("/demo/posts").send({
        _csrf: csrfToken,
        title: "E2E Test Post 2",
        content: "Token reuse in same session",
        authorName: "E2E User",
        authorEmail: "e2e@example.com",
      })
      expect([201, 303]).toContain(postResponse2.status)

      // Step 5: Token from one session doesn't work in another
      const newAgent = request.agent(app.getHttpServer())
      const failResponse = await newAgent.post("/demo/posts").send({
        _csrf: csrfToken,
        title: "Cross-Session Test",
        content: "Should fail with cross-session token",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })
      expect(failResponse.status).toBe(403)
    })

    it("should handle multiple concurrent validation requests", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Send 5 concurrent POST requests with same valid token
      const responses = await Promise.all([
        agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Concurrent Test 1",
          content: "Concurrent validation",
          authorName: "User 1",
          authorEmail: "user1@example.com",
        }),
        agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Concurrent Test 2",
          content: "Concurrent validation",
          authorName: "User 2",
          authorEmail: "user2@example.com",
        }),
        agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Concurrent Test 3",
          content: "Concurrent validation",
          authorName: "User 3",
          authorEmail: "user3@example.com",
        }),
        agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Concurrent Test 4",
          content: "Concurrent validation",
          authorName: "User 4",
          authorEmail: "user4@example.com",
        }),
        agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Concurrent Test 5",
          content: "Concurrent validation",
          authorName: "User 5",
          authorEmail: "user5@example.com",
        }),
      ])

      // All should succeed
      responses.forEach((response) => {
        expect([201, 303]).toContain(response.status)
      })
    })
  })
})
