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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.demoPost.deleteMany({})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.demoUser.deleteMany({})
    await prisma.$disconnect()
    await moduleRef.close()
  })

  beforeEach(async () => {
    // Clean up before each test
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.demoPost.deleteMany({})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.demoUser.deleteMany({})
  })

  describe("Quickstart Examples", () => {
    it("should verify PrismaService is injectable and accessible", () => {
      expect(prisma).toBeDefined()
      expect(prisma.$connect).toBeDefined()
      expect(prisma.demoUser).toBeDefined()
      expect(prisma.demoPost).toBeDefined()
    })

    it("should verify basic CRUD operations work as documented", async () => {
      // Example from quickstart.md: getAllUsers
      const initialUsers = await service.getAllUsers()
      expect(initialUsers).toEqual([])

      // Example from quickstart.md: createUser
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = await service.createUser({
        email: "user@example.com",
        name: "Test User",
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.id).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.email).toBe("user@example.com")

      // Example from quickstart.md: getUserWithPosts (via createPost which includes author)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const post = await service.createPost({
        title: "First Post",
        content: "Hello World",
        authorName: "Test User",
        authorEmail: "user@example.com",
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(post).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(post.author).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(post.author.email).toBe("user@example.com")

      // Verify getAllPosts works
      const posts = await service.getAllPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0]).toHaveProperty("author")
    })

    it("should verify Prisma Client types are available", async () => {
      // This test verifies that TypeScript types from Prisma Client work correctly
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const user = await prisma.demoUser.create({
        data: {
          name: "Type Test User",
          email: "typetest@example.com",
        },
      })

      // TypeScript should infer types correctly
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(typeof user.id).toBe("string")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(typeof user.name).toBe("string")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(typeof user.email).toBe("string")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it("should verify relations work as documented", async () => {
      // Create user and post with relation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.posts).toHaveLength(2)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.posts[0].title).toBe("Post 1")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(user.posts[1].title).toBe("Post 2")
    })

    it("should verify enum values work correctly", async () => {
      // Test all DemoPostStatus enum values
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = await service.createUser({
        name: "Enum Test",
        email: "enum@example.com",
      })

      // Test DRAFT status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const draftPost = await service.createPost({
        title: "Draft",
        status: "DRAFT",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(draftPost.status).toBe("DRAFT")

      // Test PUBLISHED status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const publishedPost = await service.createPost({
        title: "Published",
        status: "PUBLISHED",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(publishedPost.status).toBe("PUBLISHED")

      // Test ARCHIVED status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const archivedPost = await service.createPost({
        title: "Archived",
        status: "ARCHIVED",
        authorName: "Enum Test",
        authorEmail: "enum@example.com",
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(archivedPost.status).toBe("ARCHIVED")
    })

    it("should verify cascade delete works (onDelete: Cascade)", async () => {
      // Create user with posts
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const postsBefore = await prisma.demoPost.count()
      expect(postsBefore).toBe(2)

      // Delete user
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await prisma.demoUser.delete({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { id: user.id },
      })

      // Verify posts were cascade deleted
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const postsAfter = await prisma.demoPost.count()
      expect(postsAfter).toBe(0)
    })
  })
})
