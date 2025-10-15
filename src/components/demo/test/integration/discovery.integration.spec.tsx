/**
 * Test Discovery Verification (React)
 *
 * This test verifies that React tests placed in component folders are automatically
 * discovered and executed by Jest with the jsdom environment.
 */

import { render, screen } from "@testing-library/react"
import { DemoPage } from "../../ui/DemoPage"

describe("Component Test Discovery (React)", () => {
  it("should discover and run React tests in component test directories", () => {
    // This test being executed proves that Jest discovers React tests in:
    // src/components/**/test/**/*.spec.tsx

    expect(true).toBe(true)
  })

  it("should have jsdom environment for React testing", () => {
    // Verify we're in jsdom environment
    expect(typeof document).toBe("object")
    expect(typeof window).toBe("object")
  })

  it("should be able to test component components", () => {
    // Tests in component folders can import and test their components
    render(<DemoPage title="Test" />)

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("should have access to React Testing Library", () => {
    // Verify testing utilities are available
    expect(typeof render).toBe("function")
    expect(typeof screen).toBe("object")
  })
})
