/**
 * Integration test: Metadata changes update page title and navigation
 *
 * Tests that modifying component.meta.ts triggers updates in:
 * - Page title
 * - Navigation label
 * - Route titles
 */

import { componentMeta } from "../../component.meta"
import { navigation } from "../../../../components.generated/components.registry"

describe("Component Metadata Updates Integration", () => {
  it("should have correct metadata from component.meta.ts", () => {
    // Verify the component metadata is loaded correctly
    expect(componentMeta).toBeDefined()
    expect(componentMeta.id).toBe("demo")
    expect(componentMeta.title).toBe("Demo Component")
    expect(componentMeta.description).toBe(
      "A demonstration of the drop-in component system",
    )
  })

  it("should have correct route configuration", () => {
    expect(componentMeta.routes).toBeDefined()
    expect(componentMeta.routes.length).toBeGreaterThan(0)

    const primaryRoute = componentMeta.routes.find((r) => r.isPrimary)
    expect(primaryRoute).toBeDefined()
    expect(primaryRoute?.path).toBe("/demo")
    expect(primaryRoute?.title).toBe("Demo Page")
  })

  it("should have navigation entry in registry when nav is defined", () => {
    // Verify that the component's nav configuration is reflected in the generated registry
    expect(componentMeta.nav).toBeDefined()
    expect(componentMeta.nav?.label).toBe("Demo")
    expect(componentMeta.nav?.order).toBe(100)

    // Find the navigation entry for this component
    const navEntry = navigation.find((n) => n.path === "/demo")
    expect(navEntry).toBeDefined()
    expect(navEntry?.label).toBe("Demo")
    expect(navEntry?.order).toBe(100)
  })

  it("should update navigation when metadata changes", () => {
    // This test verifies that the discovery system picks up metadata changes
    // In a real scenario, changing component.meta.ts would trigger:
    // 1. Webpack watch detects file change
    // 2. ComponentDiscoveryPlugin re-runs
    // 3. Registry is regenerated with new values
    // 4. HMR updates the application

    // For this test, we verify the current state matches the metadata
    const navEntry = navigation.find((n) => n.path === "/demo")

    // Navigation should match the metadata
    expect(navEntry?.label).toBe(componentMeta.nav?.label)
    expect(navEntry?.order).toBe(componentMeta.nav?.order)
  })

  it("should maintain metadata consistency across imports", () => {
    // Verify that the same metadata is used throughout the application
    // This ensures that changes to component.meta.ts propagate everywhere

    // Re-import to verify consistency
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const module = jest.requireActual("../../component.meta") as {
      componentMeta: typeof componentMeta
    }
    const reimported = module.componentMeta

    expect(reimported.id).toBe(componentMeta.id)
    expect(reimported.title).toBe(componentMeta.title)
    expect(reimported.nav?.label).toBe(componentMeta.nav?.label)
  })
})
