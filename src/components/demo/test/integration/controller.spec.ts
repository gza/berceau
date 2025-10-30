/**
 * Controller Integration Tests
 *
 * Tests the DemoController routes and JSX rendering
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { DemoController } from "../../component.controller"
import { DemoComponentService } from "../../component.service"
import { PrismaService } from "../../../../database/runtime/prisma.service"

describe("DemoController - Routes and Rendering", () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DemoController],
      providers: [DemoComponentService, PrismaService],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    prisma = moduleRef.get<PrismaService>(PrismaService)
    await prisma.$connect()
  })

  afterAll(async () => {
    // Clean up

    await prisma.demoPost.deleteMany({})

    await prisma.demoUser.deleteMany({})
    await prisma.$disconnect()
    await app.close()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.demoPost.deleteMany({})
    await prisma.demoUser.deleteMany({})
  })

  describe("GET /demo/posts", () => {
    it("should return HTML with posts list page", async () => {
      const response = await request(app.getHttpServer()).get("/demo/posts")

      expect(response.status).toBe(200)
      expect(response.type).toBe("text/html")
      expect(response.text).toContain("Demo Posts - Database Integration")
      expect(response.text).toContain("Add New Post")
    })

    it("should display 'No posts yet' message when there are no posts", async () => {
      const response = await request(app.getHttpServer()).get("/demo/posts")

      expect(response.status).toBe(200)
      expect(response.text).toContain("No posts yet")
      expect(response.text).toContain("All Posts")
    })

    it("should display posts when they exist", async () => {
      // Create a test post directly

      const user = await prisma.demoUser.create({
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      })

      await prisma.demoPost.create({
        data: {
          title: "Test Post",
          content: "Test content",
          status: "PUBLISHED",

          authorId: user.id,
        },
      })

      const response = await request(app.getHttpServer()).get("/demo/posts")

      expect(response.status).toBe(200)
      expect(response.text).toContain("Test Post")
      expect(response.text).toContain("Test User")
      expect(response.text).toContain("All Posts")
    })
  })

  describe("POST /demo/posts", () => {
    it("should create a new post and redirect to posts list", async () => {
      const response = await request(app.getHttpServer())
        .post("/demo/posts")
        .send({
          title: "New Post",
          content: "New content",
          status: "PUBLISHED",
          authorName: "John Doe",
          authorEmail: "john@example.com",
        })

      expect(response.status).toBe(303)
      expect(response.header.location).toBe("/demo/posts")

      // Verify post was created

      const posts = await prisma.demoPost.findMany()

      expect(posts.length).toBe(1)

      expect(posts[0].title).toBe("New Post")
    })

    it("should create a post with optional content", async () => {
      const response = await request(app.getHttpServer())
        .post("/demo/posts")
        .send({
          title: "Minimal Post",
          authorName: "Jane Doe",
          authorEmail: "jane@example.com",
        })

      expect(response.status).toBe(303)

      // Verify post was created with null content

      const posts = await prisma.demoPost.findMany()

      expect(posts[0].content).toBeNull()

      expect(posts[0].status).toBe("DRAFT")
    })
  })

  describe("POST /demo/posts/:id/delete", () => {
    it("should delete a post and redirect to posts list", async () => {
      // Create a test post

      const user = await prisma.demoUser.create({
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      })

      const post = await prisma.demoPost.create({
        data: {
          title: "To Delete",
          status: "DRAFT",

          authorId: user.id,
        },
      })

      // Delete the post

      const response = await request(app.getHttpServer()).post(
        `/demo/posts/${post.id}/delete`,
      )

      expect(response.status).toBe(303)
      expect(response.header.location).toBe("/demo/posts")

      // Verify post was deleted

      const posts = await prisma.demoPost.findMany()

      expect(posts.length).toBe(0)
    })

    it("should return 404 when trying to delete non-existent post", async () => {
      const response = await request(app.getHttpServer()).post(
        "/demo/posts/non-existent-id/delete",
      )

      expect(response.status).toBe(404)
    })
  })
})
