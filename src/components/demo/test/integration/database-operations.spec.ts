/**
 * Database Operations Integration Tests
 *
 * Tests the DemoComponentService CRUD operations
 */

import { Test, TestingModule } from "@nestjs/testing"
import { DemoComponentService } from "../../component.service"
import { PrismaService } from "../../../../database/runtime/prisma.service"

describe("DemoComponentService - Database Operations", () => {
  let service: DemoComponentService
  let prisma: PrismaService
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [DemoComponentService, PrismaService],
    }).compile()

    service = moduleRef.get<DemoComponentService>(DemoComponentService)
    prisma = moduleRef.get<PrismaService>(PrismaService)

    // Connect to database (PrismaService auto-handles schema isolation)
    await prisma.$connect()
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.demoPost.deleteMany({})
    await prisma.demoUser.deleteMany({})

    // Disconnect
    await prisma.$disconnect()
    await moduleRef.close()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.demoPost.deleteMany({})
    await prisma.demoUser.deleteMany({})
  })

  describe("createUser", () => {
    it("should create a new user", async () => {
      const user = await service.createUser({
        name: "John Doe",
        email: "john@example.com",
      })

      expect(user).toBeDefined()

      expect(user.name).toBe("John Doe")

      expect(user.email).toBe("john@example.com")

      expect(user.id).toBeDefined()
    })

    it("should return existing user if email already exists (upsert)", async () => {
      // Create first user

      const user1 = await service.createUser({
        name: "John Doe",
        email: "john@example.com",
      })

      // Try to create user with same email

      const user2 = await service.createUser({
        name: "Jane Doe",
        email: "john@example.com",
      })

      // Should return the same user

      expect(user1.id).toBe(user2.id)

      expect(user2.name).toBe("John Doe") // Original name preserved
    })
  })

  describe("createPost", () => {
    it("should create a new post with author", async () => {
      const post = await service.createPost({
        title: "Test Post",
        content: "This is a test post",
        status: "PUBLISHED",
        authorName: "John Doe",
        authorEmail: "john@example.com",
      })

      expect(post).toBeDefined()

      expect(post.title).toBe("Test Post")

      expect(post.content).toBe("This is a test post")

      expect(post.status).toBe("PUBLISHED")

      expect(post.author).toBeDefined()

      expect(post.author.name).toBe("John Doe")
    })

    it("should create post with default DRAFT status", async () => {
      const post = await service.createPost({
        title: "Draft Post",
        authorName: "Jane Doe",
        authorEmail: "jane@example.com",
      })

      expect(post.status).toBe("DRAFT")

      expect(post.content).toBeNull()
    })

    it("should upsert author if they already exist", async () => {
      // Create first post with new author

      const post1 = await service.createPost({
        title: "First Post",
        authorName: "John Doe",
        authorEmail: "john@example.com",
      })

      // Create second post with same author

      const post2 = await service.createPost({
        title: "Second Post",
        authorName: "John Doe",
        authorEmail: "john@example.com",
      })

      // Should use the same author

      expect(post1.authorId).toBe(post2.authorId)
    })
  })

  describe("getAllPosts", () => {
    it("should return empty array when no posts exist", async () => {
      const posts = await service.getAllPosts()

      expect(posts).toBeDefined()
      expect(Array.isArray(posts)).toBe(true)
      expect(posts.length).toBe(0)
    })

    it("should return all posts with authors", async () => {
      // Create multiple posts
      await service.createPost({
        title: "Post 1",
        authorName: "John Doe",
        authorEmail: "john@example.com",
      })

      await service.createPost({
        title: "Post 2",
        authorName: "Jane Doe",
        authorEmail: "jane@example.com",
      })

      const posts = await service.getAllPosts()

      expect(posts.length).toBe(2)
      expect(posts[0]).toHaveProperty("author")
      expect(posts[1]).toHaveProperty("author")
    })

    it("should return posts in descending order by createdAt", async () => {
      // Create posts with slight delay

      const post1 = await service.createPost({
        title: "First Post",
        authorName: "John",
        authorEmail: "john@example.com",
      })

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const post2 = await service.createPost({
        title: "Second Post",
        authorName: "Jane",
        authorEmail: "jane@example.com",
      })

      const posts = await service.getAllPosts()

      expect(posts[0].id).toBe(post2.id) // Newest first

      expect(posts[1].id).toBe(post1.id)
    })
  })

  describe("deletePost", () => {
    it("should delete a post by ID", async () => {
      // Create a post

      const post = await service.createPost({
        title: "To Delete",
        authorName: "John",
        authorEmail: "john@example.com",
      })

      // Delete it

      await service.deletePost(post.id)

      // Verify it's gone
      const posts = await service.getAllPosts()
      expect(posts.length).toBe(0)
    })

    it("should throw NotFoundException for non-existent post", async () => {
      await expect(service.deletePost("non-existent-id")).rejects.toThrow(
        "Post with ID non-existent-id not found",
      )
    })
  })

  describe("getPostById", () => {
    it("should return a post with author by ID", async () => {
      // Create a post

      const createdPost = await service.createPost({
        title: "Find Me",
        content: "Content here",
        authorName: "John",
        authorEmail: "john@example.com",
      })

      // Get it by ID

      const foundPost = await service.getPostById(createdPost.id)

      expect(foundPost.id).toBe(createdPost.id)

      expect(foundPost.title).toBe("Find Me")

      expect(foundPost.author).toBeDefined()
    })

    it("should throw NotFoundException for non-existent post", async () => {
      await expect(service.getPostById("non-existent-id")).rejects.toThrow(
        "Post with ID non-existent-id not found",
      )
    })
  })

  describe("getAllUsers", () => {
    it("should return empty array when no users exist", async () => {
      const users = await service.getAllUsers()

      expect(users).toBeDefined()
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBe(0)
    })

    it("should return all users with their posts", async () => {
      // Create posts (which create users)
      await service.createPost({
        title: "Post 1",
        authorName: "John",
        authorEmail: "john@example.com",
      })

      await service.createPost({
        title: "Post 2",
        authorName: "John",
        authorEmail: "john@example.com",
      })

      await service.createPost({
        title: "Post 3",
        authorName: "Jane",
        authorEmail: "jane@example.com",
      })

      const users = await service.getAllUsers()

      expect(users.length).toBe(2) // John and Jane
      expect(users[0]).toHaveProperty("posts")
      expect(users[1]).toHaveProperty("posts")

      const johnPosts = users.find((u) => u.name === "John")?.posts
      expect(johnPosts).toHaveLength(2)
    })
  })
})
