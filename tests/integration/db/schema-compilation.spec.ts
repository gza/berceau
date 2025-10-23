/**
 * Schema Compilation Integration Test
 *
 * Verifies that the complete build process correctly discovers component schemas,
 * copies them to the central directory, generates main.prisma, and creates a
 * functional Prisma Client with all models.
 */

import * as fs from "fs"
import * as path from "path"
import { PrismaClient } from "@prisma/client"

describe("Database Schema Compilation Integration", () => {
  describe("Build Process", () => {
    it("should have generated main.prisma with correct configuration", () => {
      const mainSchemaPath = path.join(
        process.cwd(),
        "prisma",
        "schema",
        "main.prisma",
      )

      expect(fs.existsSync(mainSchemaPath)).toBe(true)

      const content = fs.readFileSync(mainSchemaPath, "utf8")
      
      // Verify datasource configuration
      expect(content).toContain('datasource db')
      expect(content).toContain('provider = "postgresql"')
      expect(content).toContain('url      = env("MIGRATION_DATABASE_URL")')
      
      // Verify generator configuration
      expect(content).toContain('generator client')
      expect(content).toContain('provider = "prisma-client-js"')
      
      // Verify it's marked as auto-generated
      expect(content).toContain('auto-generated')
      expect(content).toContain('DO NOT EDIT MANUALLY')
    })

    it("should have copied demo component schema to central directory", () => {
      const demoSchemaPath = path.join(
        process.cwd(),
        "prisma",
        "schema",
        "demo.prisma",
      )

      expect(fs.existsSync(demoSchemaPath)).toBe(true)

      const content = fs.readFileSync(demoSchemaPath, "utf8")
      
      // Verify models are present
      expect(content).toContain('model DemoUser')
      expect(content).toContain('model DemoPost')
      
      // Verify enum is present
      expect(content).toContain('enum DemoPostStatus')
      expect(content).toContain('DRAFT')
      expect(content).toContain('PUBLISHED')
      expect(content).toContain('ARCHIVED')
      
      // Verify relationships
      expect(content).toContain('posts     DemoPost[]')
      expect(content).toContain('author    DemoUser')
      expect(content).toContain('@relation(fields: [authorId], references: [id], onDelete: Cascade)')
      
      // Verify indexes
      expect(content).toContain('@@index([authorId])')
      
      // Verify it contains ONLY models and enums (no datasource/generator)
      expect(content).not.toContain('datasource db')
      expect(content).not.toContain('generator client')
    })

    it("should have generated complete migration directory structure", () => {
      const migrationsDir = path.join(
        process.cwd(),
        "prisma",
        "schema",
        "migrations",
      )

      expect(fs.existsSync(migrationsDir)).toBe(true)

      // Check for migration lock file
      const lockFile = path.join(migrationsDir, "migration_lock.toml")
      expect(fs.existsSync(lockFile)).toBe(true)
      
      const lockContent = fs.readFileSync(lockFile, "utf8")
      expect(lockContent).toContain('provider = "postgresql"')
    })
  })

  describe("Generated Prisma Client", () => {
    let prisma: PrismaClient

    beforeAll(() => {
      prisma = new PrismaClient()
    })

    afterAll(async () => {
      await prisma.$disconnect()
    })

    it("should have DemoUser model available in Prisma Client", () => {
      expect(prisma.demoUser).toBeDefined()
      expect(typeof prisma.demoUser.findMany).toBe("function")
      expect(typeof prisma.demoUser.create).toBe("function")
      expect(typeof prisma.demoUser.update).toBe("function")
      expect(typeof prisma.demoUser.delete).toBe("function")
    })

    it("should have DemoPost model available in Prisma Client", () => {
      expect(prisma.demoPost).toBeDefined()
      expect(typeof prisma.demoPost.findMany).toBe("function")
      expect(typeof prisma.demoPost.create).toBe("function")
      expect(typeof prisma.demoPost.update).toBe("function")
      expect(typeof prisma.demoPost.delete).toBe("function")
    })

    it("should have DemoPostStatus enum available", async () => {
      // Import enum from generated client
      const { DemoPostStatus } = await import("@prisma/client")
      
      expect(DemoPostStatus).toBeDefined()
      expect(DemoPostStatus.DRAFT).toBe("DRAFT")
      expect(DemoPostStatus.PUBLISHED).toBe("PUBLISHED")
      expect(DemoPostStatus.ARCHIVED).toBe("ARCHIVED")
    })

    it("should support TypeScript type inference for models", async () => {
      // This test verifies that TypeScript types are correctly generated
      // by attempting operations that would fail at compile-time if types were wrong
      
      // Type check will fail at compile time if prisma.demoUser doesn't have correct types
      const userQuery = prisma.demoUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          posts: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      })

      // If this compiles without errors, types are correct
      expect(userQuery).toBeDefined()
    })

    it("should connect to database successfully", async () => {
      // Verify database connection works
      await expect(prisma.$connect()).resolves.not.toThrow()
    })
  })

  describe("Multi-File Schema Support", () => {
    it("should load all .prisma files from schema directory", () => {
      const schemaDir = path.join(process.cwd(), "prisma", "schema")
      const files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".prisma"))
      
      // Should have at least main.prisma and demo.prisma
      expect(files.length).toBeGreaterThanOrEqual(2)
      expect(files).toContain("main.prisma")
      expect(files).toContain("demo.prisma")
    })

    it("should have prisma.config.ts configured for multi-file schema", () => {
      const configPath = path.join(process.cwd(), "prisma.config.ts")
      expect(fs.existsSync(configPath)).toBe(true)
      
      const content = fs.readFileSync(configPath, "utf8")
      expect(content).toContain("schema: './prisma/schema'")
    })
  })
})
