import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { AppModule } from "../../../../app.module"

describe("PagesController Contract", () => {
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

  it("should return a valid HTML document when requesting root path (/)", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/").expect(200)

    // The response should be HTML
    expect(response.headers["content-type"]).toMatch(/text\/html/)

    // The response should contain basic HTML structure
    expect(response.text).toContain("<!DOCTYPE html>")
    expect(response.text).toContain("<html")
    expect(response.text).toContain("<head")
    expect(response.text).toContain("<body")
    expect(response.text).toContain("</html>")

    // The response should contain the SSR-rendered React application
    expect(response.text).toContain("Welcome to the NesTsx")
    expect(response.text).toContain("Navigation")
    expect(response.text).toContain('aria-current="page"')
  })

  it("should return the About page for /about", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/about").expect(200)

    expect(response.headers["content-type"]).toMatch(/text\/html/)
    expect(response.text).toContain("<!DOCTYPE html>")
    expect(response.text).toContain("About Us")
    expect(response.text).toContain("Technology Stack")
    expect(response.text).toContain('aria-current="page"')
  })

  it("should return the custom not found page for unknown routes", async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(httpServer).get("/unknown").expect(404)

    expect(response.headers["content-type"]).toMatch(/text\/html/)
    expect(response.text).toContain("<!DOCTYPE html>")
    expect(response.text).toContain("404 Not Found")
    expect(response.text).toContain(
      "Sorry, the page you are looking for does not exist",
    )
    expect(response.text).not.toContain('aria-current="page"')
  })
})
