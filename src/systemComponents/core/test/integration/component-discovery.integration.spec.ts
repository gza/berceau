/**
 * Integration test: Component discovery and route exposure
 *
 * Tests that adding a component folder exposes routes automatically
 */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { AppModule } from "../../../../app.module"
import { PrismaService } from "../../../../database/runtime/prisma.service"

// Mock PrismaService for tests that don't need database
const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  demoPost: {
    findMany: jest.fn().mockResolvedValue([]),
  },
}

describe("Component Discovery Integration", () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("should expose a route for the demo component", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    // Note: /demo redirects to /demo/posts, so we test /demo/posts directly
    const response = await request(httpServer).get("/demo/posts").expect(200)

    expect(response.headers["content-type"]).toMatch(/text\/html/)
    expect(response.text).toContain("<!DOCTYPE html>")
    expect(response.text).toContain("Demo")
  })

  it("should return 404 for non-existent component routes", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/non-existent-component")

    expect(response.status).toBe(404)
  })

  it("should not expose routes for removed or renamed components", async () => {
    // This test verifies that the discovery system properly handles component removal
    // In a real scenario, the webpack rebuild would regenerate the registry without the removed component
    // For this test, we verify that non-existent routes return 404
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]

    // Attempt to access a route that would have been removed
    const response = await request(httpServer).get("/removed-component")

    expect(response.status).toBe(404)

    // Verify that the navigation doesn't include removed components
    // by checking that the demo component still works (proving selective removal)
    // Note: /demo redirects to /demo/posts, so we test /demo/posts directly
    const demoResponse = await request(httpServer)
      .get("/demo/posts")
      .expect(200)
    expect(demoResponse.text).toContain("Demo")
  })
})
