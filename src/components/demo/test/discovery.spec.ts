/**
 * Test Discovery Verification
 *
 * This test verifies that tests placed in component folders are automatically
 * discovered and executed by Jest without requiring additional configuration.
 */

import { componentMeta } from "../component.meta"

describe("Component Test Discovery", () => {
  it("should discover and run Node tests in component test directories", () => {
    // This test being executed proves that Jest discovers tests in:
    // src/components/**/test/**/*.spec.ts

    expect(true).toBe(true)
  })

  it("should have access to component metadata", () => {
    // Tests in component folders can import from their parent component
    expect(componentMeta).toBeDefined()
    expect(componentMeta.id).toBe("demo")
  })

  it("should run without additional Jest configuration", () => {
    // This test proves that the Jest config automatically includes
    // tests in src/components/**/test/ directories

    // Verify test environment
    expect(typeof describe).toBe("function")
    expect(typeof it).toBe("function")
    expect(typeof expect).toBe("function")
  })
})
