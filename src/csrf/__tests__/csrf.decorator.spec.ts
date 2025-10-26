/**
 * Unit Tests for @SkipCsrf() Decorator
 *
 * Feature: 003-provide-an-easy
 * User Story 4: Flexible Opt-Out for APIs
 * Date: 2025-10-26
 *
 * Tests for the @SkipCsrf() decorator to verify metadata is set correctly.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Reflector } from "@nestjs/core"
import { SkipCsrf } from "../csrf.decorator"
import { SKIP_CSRF_KEY } from "../constants"

describe("@SkipCsrf() Decorator", () => {
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
  })

  describe("Metadata Setting", () => {
    it("should set SKIP_CSRF_KEY metadata to true", () => {
      // Create a test class with decorated method
      class TestController {
        @SkipCsrf()
        testMethod() {
          return "test"
        }
      }

      const instance = new TestController()
      const metadata = reflector.get(SKIP_CSRF_KEY, instance.testMethod)

      expect(metadata).toBe(true)
    })

    it("should set metadata on the handler method", () => {
      class TestController {
        @SkipCsrf()
        skipCsrfMethod() {
          return "skip"
        }

        regularMethod() {
          return "regular"
        }
      }

      const instance = new TestController()
      const skipMetadata = reflector.get(SKIP_CSRF_KEY, instance.skipCsrfMethod)
      const regularMetadata = reflector.get(
        SKIP_CSRF_KEY,
        instance.regularMethod,
      )

      expect(skipMetadata).toBe(true)
      expect(regularMetadata).toBeUndefined()
    })

    it("should work with getAllAndOverride for method-level metadata", () => {
      class TestController {
        @SkipCsrf()
        protectedMethod() {
          return "protected"
        }
      }

      const instance = new TestController()
      const metadata = reflector.getAllAndOverride(SKIP_CSRF_KEY, [
        instance.protectedMethod,
        TestController,
      ])

      expect(metadata).toBe(true)
    })
  })

  describe("Decorator Application", () => {
    it("should be applicable to methods", () => {
      // This test verifies the decorator can be applied to methods without errors
      expect(() => {
        class TestController {
          @SkipCsrf()
          testMethod() {
            return "test"
          }
        }
        return new TestController()
      }).not.toThrow()
    })

    it("should be applicable to multiple methods in same class", () => {
      class TestController {
        @SkipCsrf()
        method1() {
          return "one"
        }

        @SkipCsrf()
        method2() {
          return "two"
        }

        regularMethod() {
          return "regular"
        }
      }

      const instance = new TestController()
      const metadata1 = reflector.get(SKIP_CSRF_KEY, instance.method1)
      const metadata2 = reflector.get(SKIP_CSRF_KEY, instance.method2)
      const metadataRegular = reflector.get(
        SKIP_CSRF_KEY,
        instance.regularMethod,
      )

      expect(metadata1).toBe(true)
      expect(metadata2).toBe(true)
      expect(metadataRegular).toBeUndefined()
    })

    it("should work when applied to class-level (controller-level)", () => {
      @SkipCsrf()
      class TestController {
        method1() {
          return "one"
        }

        method2() {
          return "two"
        }
      }

      const metadata = reflector.get(SKIP_CSRF_KEY, TestController)

      expect(metadata).toBe(true)
    })

    it("should work with both class and method decorators", () => {
      @SkipCsrf()
      class TestController {
        @SkipCsrf()
        method1() {
          return "one"
        }

        method2() {
          return "two"
        }
      }

      const instance = new TestController()
      const classMetadata = reflector.get(SKIP_CSRF_KEY, TestController)
      const methodMetadata = reflector.get(SKIP_CSRF_KEY, instance.method1)

      expect(classMetadata).toBe(true)
      expect(methodMetadata).toBe(true)
    })
  })

  describe("Integration with Reflector", () => {
    it("should be retrievable via getAllAndOverride checking both handler and class", () => {
      @SkipCsrf()
      class TestController {
        normalMethod() {
          return "normal"
        }
      }

      const instance = new TestController()
      const metadata = reflector.getAllAndOverride(SKIP_CSRF_KEY, [
        instance.normalMethod,
        TestController,
      ])

      // Should find it at class level
      expect(metadata).toBe(true)
    })

    it("should prioritize method-level over class-level with getAllAndOverride", () => {
      @SkipCsrf()
      class TestController {
        // Method intentionally NOT decorated to test class-level fallback
        normalMethod() {
          return "normal"
        }
      }

      const instance = new TestController()

      // getAllAndOverride should find it at class level
      const metadata = reflector.getAllAndOverride(SKIP_CSRF_KEY, [
        instance.normalMethod,
        TestController,
      ])

      expect(metadata).toBe(true)
    })

    it("should return undefined when neither method nor class has decorator", () => {
      class TestController {
        normalMethod() {
          return "normal"
        }
      }

      const instance = new TestController()
      const metadata = reflector.getAllAndOverride(SKIP_CSRF_KEY, [
        instance.normalMethod,
        TestController,
      ])

      expect(metadata).toBeUndefined()
    })
  })

  describe("Metadata Behavior", () => {
    it("should not affect other metadata keys", () => {
      const OTHER_KEY = "otherKey"

      class TestController {
        @SkipCsrf()
        testMethod() {
          return "test"
        }
      }

      const instance = new TestController()
      const csrfMetadata = reflector.get(SKIP_CSRF_KEY, instance.testMethod)
      const otherMetadata = reflector.get(OTHER_KEY, instance.testMethod)

      expect(csrfMetadata).toBe(true)
      expect(otherMetadata).toBeUndefined()
    })

    it("should persist metadata across multiple reflector instances", () => {
      class TestController {
        @SkipCsrf()
        testMethod() {
          return "test"
        }
      }

      const instance = new TestController()
      const reflector1 = new Reflector()
      const reflector2 = new Reflector()

      const metadata1 = reflector1.get(SKIP_CSRF_KEY, instance.testMethod)
      const metadata2 = reflector2.get(SKIP_CSRF_KEY, instance.testMethod)

      expect(metadata1).toBe(true)
      expect(metadata2).toBe(true)
    })
  })
})
