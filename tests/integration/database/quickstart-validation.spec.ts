/**
 * Quickstart Validation Test
 *
 * This test validates that all examples in quickstart.md work correctly
 */

import { Test, TestingModule } from "@nestjs/testing"
import { DemoComponentService } from "../../../src/components/demo/component.service"
import { PrismaService } from "../../../src/database/runtime/prisma.service"

describe("Quickstart Validation", () => {
  let service: DemoComponentService
  let prisma: PrismaService
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [DemoComponentService, PrismaService],
    }).compile()

    service = moduleRef.get<DemoComponentService>(DemoComponentService)
    prisma = moduleRef.get<PrismaService>(PrismaService)

    await prisma.$connect()
  })

  afterAll(async () => {
    // Clean up
    await prisma.demoPost.deleteMany({})
    await prisma.demoUser.deleteMany({})
    await prisma.$disconnect()
    await moduleRef.close()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.demoPost.deleteMany({})
    await prisma.demoUser.deleteMany({})
  })

  describe("Quickstart Examples", () => {
    it("should verify PrismaService is injectable and accessible", () => {
      expect(prisma).toBeDefined()
      expect(typeof prisma.$connect).toBe("function")
      expect(prisma.demoUser).toBeDefined()
      expect(prisma.demoPost).toBeDefined()
    })

    it("should verify basic CRUD operations work as documented", async () => {
      // Example from quickstart.md: getAllUsers
      const initialUsers = await service.getAllUsers()
      expect(initialUsers).toEqual([])

      // Example from quickstart.md: createUser
      const user = await service.createUser({
        email: "user@example.com",
        name: "Test User",
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toBe("user@example.com")

      // Example from quickstart.md: getUserWithPosts (via createPost which includes author)

      const post = await service.createPost({
        title: "First Post",
        content: "Hello World",
        authorName: "Test User",
        authorEmail: "user@example.com",
      })

      expect(post).toBeDefined()

      expect(post.author).toBeDefined()

      expect(post.author.email).toBe("user@example.com")

      // Verify getAllPosts works
      const posts = await service.getAllPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0]).toHaveProperty("author")
    })

    it("should verify Prisma Client types are available", async () => {
      // This test verifies that TypeScript types from Prisma Client work correctly

      const user = await prisma.demoUser.create({
        data: {
          name: "Type Test User",
          email: "typetest@example.com",
        },
      })

      // TypeScript should infer types correctly

      expect(typeof user.id).toBe("string")

      expect(typeof user.name).toBe("string")

      expect(typeof user.email).toBe("string")

      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it("should verify relations work as documented", async () => {
      // Create user and post with relation

      const user = await prisma.demoUser.create({
        data: {
          name: "Author",
          email: "author@example.com",
          posts: {
            create: [
              {
                title: "Post 1",
                content: "Content 1",
                status: "PUBLISHED",
              },
              {
                title: "Post 2",
                content: "Content 2",
                status: "DRAFT",
              },
            ],
          },
        },
        include: {
          posts: true,
        },
      })

      expect(user.posts).toHaveLength(2)

      expect(user.posts[0].title).toBe("Post 1")

      expect(user.posts[1].title).toBe("Post 2")
    })

    it("should verify enum values work correctly", async () => {
      // Test all DemoPostStatus enum values

      await service.createUser({
        name: "Enum Test",
        email: "enum@example.com",
      })

      // Test DRAFT status

      const draftPost = await service.createPost({
        title: "Draft",
        status: "DRAFT",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })

      expect(draftPost.status).toBe("DRAFT")

      // Test PUBLISHED status

      const publishedPost = await service.createPost({
        title: "Published",
        status: "PUBLISHED",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })

      expect(publishedPost.status).toBe("PUBLISHED")

      // Test ARCHIVED status

      const archivedPost = await service.createPost({
        title: "Archived",
        status: "ARCHIVED",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })

      expect(archivedPost.status).toBe("ARCHIVED")
    })

    it("should verify cascade delete works (onDelete: Cascade)", async () => {
      // Create user with posts

      const user = await prisma.demoUser.create({
        data: {
          name: "Cascade Test",
          email: "cascade@example.com",
          posts: {
            create: [
              { title: "Post 1", status: "PUBLISHED" },
              { title: "Post 2", status: "DRAFT" },
            ],
          },
        },
      })

      // Verify posts exist

      const postsBefore = await prisma.demoPost.count()
      expect(postsBefore).toBe(2)

      // Delete user

      await prisma.demoUser.delete({
        where: { id: user.id },
      })

      // Verify posts were cascade deleted

      const postsAfter = await prisma.demoPost.count()
      expect(postsAfter).toBe(0)
    })
  })
})
