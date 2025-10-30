/**
 * Unit tests for base64 image embedder
 *
 * Tests local image file to data URI conversion, size limits, unsupported formats
 */

import * as fs from "fs/promises"
import * as path from "path"
import { embedImage } from "../../../src/utils/base64-embedder"

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, "fixtures")

describe("Base64 Image Embedder", () => {
  describe("embedImage", () => {
    beforeAll(async () => {
      // Create fixtures directory and test images
      await fs.mkdir(FIXTURES_DIR, { recursive: true })

      // Create a small valid PNG (1x1 transparent pixel)
      const smallPngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      )
      await fs.writeFile(path.join(FIXTURES_DIR, "small.png"), smallPngBuffer)

      // Create a small valid JPEG
      const smallJpegBuffer = Buffer.from(
        "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==",
        "base64",
      )
      await fs.writeFile(path.join(FIXTURES_DIR, "small.jpg"), smallJpegBuffer)

      // Create a large image (exceed 100KB limit)
      const largeBuffer = Buffer.alloc(101 * 1024, 0xff)
      await fs.writeFile(path.join(FIXTURES_DIR, "large.png"), largeBuffer)

      // Create a file with unsupported extension
      await fs.writeFile(path.join(FIXTURES_DIR, "test.txt"), "Not an image")
    })

    afterAll(async () => {
      // Clean up fixtures
      try {
        await fs.rm(FIXTURES_DIR, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    })

    it("should successfully embed a small PNG image", async () => {
      const filePath = path.join(FIXTURES_DIR, "small.png")
      const result = await embedImage(filePath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toBeDefined()
      expect(result.dataUri).toMatch(/^data:image\/png;base64,/)
      expect(result.error).toBeUndefined()
    })

    it("should successfully embed a small JPEG image", async () => {
      const filePath = path.join(FIXTURES_DIR, "small.jpg")
      const result = await embedImage(filePath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toBeDefined()
      expect(result.dataUri).toMatch(/^data:image\/jpeg;base64,/)
      expect(result.error).toBeUndefined()
    })

    it("should include valid base64 encoding in data URI", async () => {
      const filePath = path.join(FIXTURES_DIR, "small.png")
      const result = await embedImage(filePath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toBeDefined()

      // Extract base64 part and verify it's valid
      const base64Part = result.dataUri?.split(",")[1]
      expect(base64Part).toBeDefined()
      expect(base64Part?.length).toBeGreaterThan(0)

      // Verify base64 can be decoded
      if (base64Part) {
        const decoded = Buffer.from(base64Part, "base64")
        expect(decoded.length).toBeGreaterThan(0)
      }
    })

    it("should reject image exceeding size limit", async () => {
      const filePath = path.join(FIXTURES_DIR, "large.png")
      const result = await embedImage(filePath)

      expect(result.success).toBe(false)
      expect(result.dataUri).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error).toContain("exceeds maximum")
      expect(result.error).toContain("102400 bytes")
    })

    it("should reject unsupported file format", async () => {
      const filePath = path.join(FIXTURES_DIR, "test.txt")
      const result = await embedImage(filePath)

      expect(result.success).toBe(false)
      expect(result.dataUri).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error).toContain("Unsupported image format")
    })

    it("should handle non-existent file", async () => {
      const filePath = path.join(FIXTURES_DIR, "nonexistent.png")
      const result = await embedImage(filePath)

      expect(result.success).toBe(false)
      expect(result.dataUri).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error).toContain("Failed to read image file")
    })

    it("should recognize .jpeg extension as JPEG", async () => {
      // Copy .jpg as .jpeg to test extension
      const jpgPath = path.join(FIXTURES_DIR, "small.jpg")
      const jpegPath = path.join(FIXTURES_DIR, "test.jpeg")
      await fs.copyFile(jpgPath, jpegPath)

      const result = await embedImage(jpegPath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toMatch(/^data:image\/jpeg;base64,/)
    })

    it("should handle different supported image formats", async () => {
      const formats = [
        { ext: "png", mime: "image/png" },
        { ext: "jpg", mime: "image/jpeg" },
      ]

      for (const format of formats) {
        const filePath = path.join(FIXTURES_DIR, `small.${format.ext}`)
        const result = await embedImage(filePath)

        expect(result.success).toBe(true)
        expect(result.dataUri).toMatch(
          new RegExp(`^data:${format.mime};base64,`),
        )
      }
    })

    it("should handle file path with special characters", async () => {
      const specialPath = path.join(FIXTURES_DIR, "image with spaces.png")
      const sourcePath = path.join(FIXTURES_DIR, "small.png")
      await fs.copyFile(sourcePath, specialPath)

      const result = await embedImage(specialPath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toBeDefined()
    })

    it("should generate consistent data URI for same image", async () => {
      const filePath = path.join(FIXTURES_DIR, "small.png")

      const result1 = await embedImage(filePath)
      const result2 = await embedImage(filePath)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.dataUri).toEqual(result2.dataUri)
    })

    it("should include complete MIME type in data URI", async () => {
      const filePath = path.join(FIXTURES_DIR, "small.png")
      const result = await embedImage(filePath)

      expect(result.success).toBe(true)
      expect(result.dataUri).toBeDefined()

      // Verify data URI format: data:[MIME type];base64,[data]
      const parts = result.dataUri?.split(";")
      expect(parts?.[0]).toMatch(/^data:image\//)
      expect(parts?.[1]).toMatch(/^base64,/)
    })
  })
})
