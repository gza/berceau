/**
 * Contract test: Feature route returns HTML as per OpenAPI spec
 *
 * Validates that SSR routes conform to contracts/features.openapi.json
 */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { AppModule } from "../../../../app.module"

describe("Feature Route Contract", () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("should return text/html for feature routes as per OpenAPI contract", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/demo").expect(200)

    // Contract: Response must be text/html
    expect(response.headers["content-type"]).toMatch(/text\/html/)

    // Contract: Response must contain valid HTML
    expect(response.text).toContain("<!DOCTYPE html>")
    expect(response.text).toContain("<html")
    expect(response.text).toContain("</html>")
  })

  it("should include navigation and layout in feature pages", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/demo").expect(200)

    // Feature pages should include the standard layout
    expect(response.text).toContain("Navigation")

    // Feature content should be present
    expect(response.text).toContain("Demo")
  })
})
