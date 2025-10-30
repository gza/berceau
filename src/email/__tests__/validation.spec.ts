/**
 * Unit tests for email validation utilities
 *
 * Tests email address validation (RFC 5322), subject constraints,
 * and HTML size limits as defined in the feature specification.
 */

import {
  validateEmailAddress,
  validateEmailAddresses,
  validateSubject,
  validateHtmlSize,
  MAX_SUBJECT_LENGTH,
  MAX_HTML_SIZE_BYTES,
} from "../validation"

describe("Email Validation", () => {
  describe("validateEmailAddress", () => {
    describe("valid email addresses", () => {
      it("should accept standard email format", () => {
        const result = validateEmailAddress("user@example.com")
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it("should accept email with dots in local part", () => {
        const result = validateEmailAddress("first.last@example.com")
        expect(result.valid).toBe(true)
      })

      it("should accept email with plus sign", () => {
        const result = validateEmailAddress("user+tag@example.com")
        expect(result.valid).toBe(true)
      })

      it("should accept email with numbers", () => {
        const result = validateEmailAddress("user123@example123.com")
        expect(result.valid).toBe(true)
      })

      it("should accept email with subdomain", () => {
        const result = validateEmailAddress("user@mail.example.com")
        expect(result.valid).toBe(true)
      })

      it("should accept email with special characters", () => {
        const result = validateEmailAddress(
          "user!#$%&'*+/=?^_`{|}~@example.com",
        )
        expect(result.valid).toBe(true)
      })

      it("should trim whitespace before validation", () => {
        const result = validateEmailAddress("  user@example.com  ")
        expect(result.valid).toBe(true)
      })
    })

    describe("invalid email addresses", () => {
      it("should reject empty string", () => {
        const result = validateEmailAddress("")
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it("should reject null", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        const result = validateEmailAddress(null as any)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("required")
      })

      it("should reject undefined", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        const result = validateEmailAddress(undefined as any)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("required")
      })

      it("should reject whitespace-only string", () => {
        const result = validateEmailAddress("   ")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("empty")
      })

      it("should reject email without @ symbol", () => {
        const result = validateEmailAddress("userexample.com")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("valid")
      })

      it("should reject email with multiple @ symbols", () => {
        const result = validateEmailAddress("user@@example.com")
        expect(result.valid).toBe(false)
      })

      it("should reject email without domain", () => {
        const result = validateEmailAddress("user@")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("valid")
      })

      it("should reject email without local part", () => {
        const result = validateEmailAddress("@example.com")
        expect(result.valid).toBe(false)
      })

      it("should reject email exceeding 254 characters", () => {
        const longEmail = "a".repeat(250) + "@example.com"
        const result = validateEmailAddress(longEmail)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("maximum length")
      })

      it("should reject email with local part exceeding 64 characters", () => {
        const longLocal = "a".repeat(65) + "@example.com"
        const result = validateEmailAddress(longLocal)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("local part")
      })

      it("should reject email with spaces", () => {
        const result = validateEmailAddress("user name@example.com")
        expect(result.valid).toBe(false)
      })

      it("should reject email with invalid characters", () => {
        const result = validateEmailAddress("user<>@example.com")
        expect(result.valid).toBe(false)
      })
    })
  })

  describe("validateEmailAddresses", () => {
    it("should accept array with single valid email", () => {
      const result = validateEmailAddresses(["user@example.com"])
      expect(result.valid).toBe(true)
    })

    it("should accept array with multiple valid emails", () => {
      const result = validateEmailAddresses([
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ])
      expect(result.valid).toBe(true)
    })

    it("should reject empty array", () => {
      const result = validateEmailAddresses([])
      expect(result.valid).toBe(false)
      expect(result.error).toContain("At least one")
    })

    it("should reject non-array input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = validateEmailAddresses("user@example.com" as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("array")
    })

    it("should reject array with one invalid email", () => {
      const result = validateEmailAddresses([
        "user1@example.com",
        "invalid-email",
        "user3@example.com",
      ])
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should return first error encountered", () => {
      const result = validateEmailAddresses([
        "valid@example.com",
        "invalid1",
        "invalid2",
      ])
      expect(result.valid).toBe(false)
      // Should report the first invalid email
      expect(result.error).toBeDefined()
    })
  })

  describe("validateSubject", () => {
    it("should accept valid subject", () => {
      const result = validateSubject("Welcome to our service")
      expect(result.valid).toBe(true)
    })

    it("should accept subject at maximum length", () => {
      const maxSubject = "a".repeat(MAX_SUBJECT_LENGTH)
      const result = validateSubject(maxSubject)
      expect(result.valid).toBe(true)
    })

    it("should accept subject with special characters", () => {
      const result = validateSubject("Re: Your order #12345 - 50% off!")
      expect(result.valid).toBe(true)
    })

    it("should accept subject with unicode characters", () => {
      const result = validateSubject("Bienvenue! 你好 🎉")
      expect(result.valid).toBe(true)
    })

    it("should reject empty string", () => {
      const result = validateSubject("")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("empty")
    })

    it("should reject whitespace-only string", () => {
      const result = validateSubject("   ")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("empty")
    })

    it("should reject null", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = validateSubject(null as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject undefined", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = validateSubject(undefined as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject subject exceeding maximum length", () => {
      const tooLong = "a".repeat(MAX_SUBJECT_LENGTH + 1)
      const result = validateSubject(tooLong)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("maximum length")
      expect(result.error).toContain("200")
    })

    it("should trim whitespace before validation", () => {
      const result = validateSubject("  Valid subject  ")
      expect(result.valid).toBe(true)
    })
  })

  describe("validateHtmlSize", () => {
    it("should accept small HTML content", () => {
      const html = "<html><body>Hello</body></html>"
      const result = validateHtmlSize(html)
      expect(result.valid).toBe(true)
    })

    it("should accept HTML at maximum size", () => {
      const maxHtml = "a".repeat(MAX_HTML_SIZE_BYTES)
      const result = validateHtmlSize(maxHtml)
      expect(result.valid).toBe(true)
    })

    it("should accept empty string", () => {
      const result = validateHtmlSize("")
      expect(result.valid).toBe(true)
    })

    it("should reject HTML exceeding maximum size", () => {
      const tooLarge = "a".repeat(MAX_HTML_SIZE_BYTES + 1)
      const result = validateHtmlSize(tooLarge)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("maximum size")
      expect(result.error).toContain("500KB")
    })

    it("should handle unicode characters correctly (byte-based)", () => {
      // Unicode characters can be multiple bytes
      const unicodeChar = "🎉" // 4 bytes in UTF-8
      const count = Math.floor(MAX_HTML_SIZE_BYTES / 4)
      const html = unicodeChar.repeat(count)
      const result = validateHtmlSize(html)
      expect(result.valid).toBe(true)

      // One more should exceed
      const tooLarge = unicodeChar.repeat(count + 1000)
      const result2 = validateHtmlSize(tooLarge)
      expect(result2.valid).toBe(false)
    })

    it("should reject null", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = validateHtmlSize(null as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject undefined", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = validateHtmlSize(undefined as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })
  })

  describe("validation constants", () => {
    it("should define MAX_SUBJECT_LENGTH as 200", () => {
      expect(MAX_SUBJECT_LENGTH).toBe(200)
    })

    it("should define MAX_HTML_SIZE_BYTES as 500KB", () => {
      expect(MAX_HTML_SIZE_BYTES).toBe(500 * 1024)
    })
  })
})
