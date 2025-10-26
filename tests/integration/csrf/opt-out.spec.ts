/**
 * CSRF Opt-Out Integration Test
 *
 * Validates User Story 4 (Flexible Opt-Out for APIs) acceptance scenarios:
 * 1. JSON API endpoint with @SkipCsrf() + no token → processed successfully
 * 2. Specific paths with @SkipCsrf() + no token → processed successfully
 * 3. Form endpoints without @SkipCsrf() → still require valid tokens
 *
 * Tests the @SkipCsrf() decorator functionality to allow API endpoints to opt-out
 * of CSRF protection while keeping form endpoints protected.
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import session from "express-session"
import { AppModule } from "../../../src/app.module"
import { TestOptOutModule } from "./fixtures/test-opt-out.module"

describe("CSRF Opt-Out (Integration)", () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestOptOutModule],
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

  describe("US4: @SkipCsrf() Decorator on Methods", () => {
    it("should allow POST to @SkipCsrf() endpoint without token", async () => {
      const response = await request(app.getHttpServer())
        .post("/test-csrf-opt-out/api/data")
        .send({ name: "Test Data" })

      expect(response.status).toBe(201)
      expect(
        (response.body as { success: boolean; data: { name: string } }).success,
      ).toBe(true)
      expect(
        (response.body as { success: boolean; data: { name: string } }).data
          .name,
      ).toBe("Test Data")
    })

    it("should reject POST to protected endpoint without token", async () => {
      const response = await request(app.getHttpServer())
        .post("/test-csrf-opt-out/protected")
        .send({ name: "Protected Data" })

      expect(response.status).toBe(403)
      expect((response.body as { message: string }).message).toContain("CSRF")
    })

    it("should accept POST to protected endpoint with valid token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch?.[1]

      // POST to protected endpoint with token
      const response = await agent
        .post("/test-csrf-opt-out/protected")
        .send({ _csrf: csrfToken, name: "Protected with Token" })

      expect(response.status).toBe(201)
      expect((response.body as { success: boolean }).success).toBe(true)
    })
  })

  describe("US4: @SkipCsrf() Decorator on Classes", () => {
    it("should allow POST to class-level @SkipCsrf() endpoint 1 without token", async () => {
      const response = await request(app.getHttpServer())
        .post("/test-csrf-opt-out-class/api/endpoint1")
        .send({ name: "Endpoint 1 Data" })

      expect(response.status).toBe(201)
      expect(
        (response.body as { success: boolean; endpoint: number }).success,
      ).toBe(true)
      expect(
        (response.body as { success: boolean; endpoint: number }).endpoint,
      ).toBe(1)
    })

    it("should allow POST to class-level @SkipCsrf() endpoint 2 without token", async () => {
      const response = await request(app.getHttpServer())
        .post("/test-csrf-opt-out-class/api/endpoint2")
        .send({ name: "Endpoint 2 Data" })

      expect(response.status).toBe(201)
      expect(
        (response.body as { success: boolean; endpoint: number }).success,
      ).toBe(true)
      expect(
        (response.body as { success: boolean; endpoint: number }).endpoint,
      ).toBe(2)
    })
  })

  describe("US4: Form Endpoints Still Protected", () => {
    it("should still require CSRF token for demo form endpoints", async () => {
      // Verify demo/posts endpoint (without @SkipCsrf) still requires token
      const response = await request(app.getHttpServer())
        .post("/demo/posts")
        .send({
          title: "Test Post",
          content: "Should be blocked",
          authorName: "Test User",
          authorEmail: "test@example.com",
        })

      expect(response.status).toBe(403)
      expect((response.body as { message: string }).message).toContain("CSRF")
    })

    it("should accept POST to demo form with valid token", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch?.[1]

      // POST with token
      const response = await agent.post("/demo/posts").send({
        _csrf: csrfToken,
        title: "Valid Token Post",
        content: "Should succeed",
        authorName: "Test User",
        authorEmail: "test@example.com",
      })

      expect([201, 303]).toContain(response.status)
    })
  })

  describe("US4: Mixed Protection Scenarios", () => {
    it("should handle concurrent requests to both protected and opt-out endpoints", async () => {
      const agent = request.agent(app.getHttpServer())

      // Get token for protected endpoint
      const getResponse = await agent.get("/demo/posts")
      const tokenMatch = /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/.exec(
        getResponse.text,
      )
      const csrfToken = tokenMatch?.[1]

      // Make concurrent requests
      const [optOutResponse, protectedResponse] = await Promise.all([
        // This should succeed (no token needed)
        request(app.getHttpServer())
          .post("/test-csrf-opt-out/api/data")
          .send({ name: "API Data" }),
        // This should succeed (token provided)
        agent
          .post("/test-csrf-opt-out/protected")
          .send({ _csrf: csrfToken, name: "Protected Data" }),
      ])

      expect(optOutResponse.status).toBe(201)
      expect(protectedResponse.status).toBe(201)
    })

    it("should not allow opt-out token to work on protected endpoints", async () => {
      // Even if we somehow pass a token to an opt-out endpoint,
      // protected endpoints should still validate their own tokens

      const agent = request.agent(app.getHttpServer())

      // Establish session
      await agent.get("/demo/posts")

      // Try to POST to protected endpoint without token
      // (even though we have a session from an opt-out request)
      await request(app.getHttpServer())
        .post("/test-csrf-opt-out/api/data")
        .send({ name: "API Data" })

      // This should still require a token
      const response = await request(app.getHttpServer())
        .post("/test-csrf-opt-out/protected")
        .send({ name: "No Token" })

      expect(response.status).toBe(403)
    })
  })
})
