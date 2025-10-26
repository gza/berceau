/**
 * CSRF Form Submission Integration Test
 *
 * Validates User Story 2 (Server-Side Validation) and User Story 3 (JSX Component for Forms)
 * acceptance scenarios:
 *
 * US2 Acceptance Scenarios:
 * 1. POST endpoint with valid token → processed normally (200/303)
 * 2. POST endpoint without token → rejected with 403
 * 3. POST endpoint with expired session token → rejected with 403
 * 4. GET/HEAD/OPTIONS endpoint without token → processed normally (200)
 *
 * US3 Acceptance Scenarios:
 * 1. Developer includes <CsrfToken /> in form → hidden input with token is rendered
 * 2. Form submission with valid token → processed successfully
 * 3. Form submission without token → rejected with error
 * 4. Multiple concurrent requests → each receives unique valid token
 */

/**
 * eslint-disable @typescript-eslint/no-unsafe-member-access,
 * eslint-disable @typescript-eslint/no-unsafe-argument,
 * eslint-disable @typescript-eslint/no-unnecessary-type-assertion
 *
 * These disables are required due to NestJS and Supertest APIs using `any` types,
 * which trigger these TypeScript eslint rules in test code. See:
 * https://github.com/nestjs/nest/issues/992 and Supertest docs for details.
 */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import session from "express-session"
import { AppModule } from "../../../src/app.module"

describe("CSRF Form Submission (Integration)", () => {
  let app: INestApplication
  let agent: ReturnType<typeof request.agent>

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

    // Create a persistent agent that maintains session cookies
    agent = request.agent(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
  })

  describe("US2: Server-Side Validation", () => {
    describe("Safe methods (GET/HEAD/OPTIONS)", () => {
      it("should allow GET request without CSRF token", async () => {
        const response = await agent.get("/demo/posts")

        expect(response.status).toBe(200)
        expect(response.text).toBeDefined()
      })

      it("should allow HEAD request without CSRF token", async () => {
        const response = await agent.head("/demo/posts")

        expect(response.status).toBe(200)
      })

      it("should allow OPTIONS request without CSRF token", async () => {
        const response = await agent.options("/demo/posts")

        // OPTIONS might return 200, 204, or 404 depending on CORS/route configuration
        expect([200, 204, 404]).toContain(response.status)
      })
    })

    describe("Unsafe methods (POST/PUT/DELETE/PATCH)", () => {
      it("should reject POST request without CSRF token (403)", async () => {
        const response = await agent.post("/demo/posts").send({
          title: "Test Post",
          content: "Test content",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toContain("CSRF")
      })

      it("should reject POST request with invalid CSRF token (403)", async () => {
        const response = await agent.post("/demo/posts").send({
          _csrf: "invalid-token-value",
          title: "Test Post",
          content: "Test content",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toContain("CSRF")
      })

      it("should accept POST request with valid CSRF token", async () => {
        // Step 1: GET request to establish session and retrieve CSRF token
        const getResponse = await agent.get("/demo/posts")
        expect(getResponse.status).toBe(200)

        // Extract CSRF token from hidden input in HTML
        const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
          getResponse.text,
        )
        expect(tokenMatch).not.toBeNull()
        const csrfToken = tokenMatch![1]
        expect(csrfToken).toBeDefined()
        expect(csrfToken.length).toBeGreaterThan(0)

        // Step 2: POST request with CSRF token (should succeed with 303 redirect)
        const postResponse = await agent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Valid CSRF Test Post",
          content: "This post has a valid CSRF token",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

        // Expect 303 redirect or 201 created
        expect([201, 303]).toContain(postResponse.status)
      })

      it("should reject POST request with expired session token", async () => {
        // Step 1: Establish session and get token
        const getResponse1 = await agent.get("/demo/posts")
        expect(getResponse1.status).toBe(200)

        const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
          getResponse1.text,
        )
        const csrfToken = tokenMatch![1]

        // Step 2: Create a new agent (new session, old token)
        const newAgent = request.agent(app.getHttpServer())

        // Step 3: Try to use old token in new session (should fail)
        const postResponse = await newAgent.post("/demo/posts").send({
          _csrf: csrfToken,
          title: "Expired Token Test",
          content: "This should fail",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

        expect(postResponse.status).toBe(403)
        expect(postResponse.body.message).toContain("CSRF")
      })
    })
  })

  describe("US3: JSX Component for Forms", () => {
    it("should render <CsrfToken /> component as hidden input with token", async () => {
      const response = await agent.get("/demo/posts")

      expect(response.status).toBe(200)
      expect(response.text).toContain('name="_csrf"')
      expect(response.text).toContain('type="hidden"')

      // Verify token value is present and non-empty
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        response.text,
      )
      expect(tokenMatch).not.toBeNull()
      expect(tokenMatch![1]).toBeTruthy()
      expect(tokenMatch![1].length).toBeGreaterThan(32) // At least 32 chars
    })

    it("should successfully submit form with <CsrfToken /> included", async () => {
      // Step 1: GET form page with CSRF token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch![1]

      // Step 2: Submit form with token (simulating browser form submission)
      const postResponse = await agent.post("/demo/posts").type("form").send({
        _csrf: csrfToken,
        title: "Form Submission Test",
        content: "Testing form submission with CSRF token",
        authorName: "Form User",
        authorEmail: "form@example.com",
      })

      expect([201, 303]).toContain(postResponse.status)
    })

    it("should reject form submission without <CsrfToken />", async () => {
      // Simulate form submission without CSRF token
      const response = await agent.post("/demo/posts").type("form").send({
        title: "No Token Test",
        content: "This should fail",
        authorName: "No Token User",
        authorEmail: "notoken@example.com",
      })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain("CSRF")
    })

    it("should provide unique tokens for multiple concurrent requests", async () => {
      // Make 3 concurrent GET requests
      const responses = await Promise.all([
        agent.get("/demo/posts"),
        agent.get("/demo/posts"),
        agent.get("/demo/posts"),
      ])

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })

      // Extract tokens from each response
      const tokens = responses.map((response) => {
        const match = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
          response.text,
        )
        return match ? match[1] : null
      })

      // All tokens should exist
      tokens.forEach((token) => {
        expect(token).toBeTruthy()
      })

      // Since they share the same session (same agent), tokens should be the same
      // This is correct behavior - same session = same token
      expect(tokens[0]).toBe(tokens[1])
      expect(tokens[1]).toBe(tokens[2])

      // Now test with different agents (different sessions)
      const agent1 = request.agent(app.getHttpServer())
      const agent2 = request.agent(app.getHttpServer())
      const agent3 = request.agent(app.getHttpServer())

      const [resp1, resp2, resp3] = await Promise.all([
        agent1.get("/demo/posts"),
        agent2.get("/demo/posts"),
        agent3.get("/demo/posts"),
      ])

      const token1 = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        resp1.text,
      )![1]
      const token2 = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        resp2.text,
      )![1]
      const token3 = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        resp3.text,
      )![1]

      // Different sessions should have different tokens
      expect(token1).not.toBe(token2)
      expect(token2).not.toBe(token3)
      expect(token1).not.toBe(token3)
    })
  })
})
