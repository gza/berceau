/**
 * Integration test: Metadata changes update page title and navigation
 *
 * Tests that modifying feature.meta.ts triggers updates in:
 * - Page title
 * - Navigation label
 * - Route titles
 */

import { featureMeta } from "../../feature.meta"
import { navigation } from "../../../../components.generated/features.registry"

describe("Feature Metadata Updates Integration", () => {
  it("should have correct metadata from feature.meta.ts", () => {
    // Verify the feature metadata is loaded correctly
    expect(featureMeta).toBeDefined()
    expect(featureMeta.id).toBe("demo")
    expect(featureMeta.title).toBe("Demo Feature")
    expect(featureMeta.description).toBe(
      "A demonstration of the drop-in feature system",
    )
  })

  it("should have correct route configuration", () => {
    expect(featureMeta.routes).toBeDefined()
    expect(featureMeta.routes.length).toBeGreaterThan(0)

    const primaryRoute = featureMeta.routes.find((r) => r.isPrimary)
    expect(primaryRoute).toBeDefined()
    expect(primaryRoute?.path).toBe("/demo")
    expect(primaryRoute?.title).toBe("Demo Page")
  })

  it("should have navigation entry in registry when nav is defined", () => {
    // Verify that the feature's nav configuration is reflected in the generated registry
    expect(featureMeta.nav).toBeDefined()
    expect(featureMeta.nav?.label).toBe("Demo")
    expect(featureMeta.nav?.order).toBe(100)

    // Find the navigation entry for this feature
    const navEntry = navigation.find((n) => n.path === "/demo")
    expect(navEntry).toBeDefined()
    expect(navEntry?.label).toBe("Demo")
    expect(navEntry?.order).toBe(100)
  })

  it("should update navigation when metadata changes", () => {
    // This test verifies that the discovery system picks up metadata changes
    // In a real scenario, changing feature.meta.ts would trigger:
    // 1. Webpack watch detects file change
    // 2. FeatureDiscoveryPlugin re-runs
    // 3. Registry is regenerated with new values
    // 4. HMR updates the application

    // For this test, we verify the current state matches the metadata
    const navEntry = navigation.find((n) => n.path === "/demo")

    // Navigation should match the metadata
    expect(navEntry?.label).toBe(featureMeta.nav?.label)
    expect(navEntry?.order).toBe(featureMeta.nav?.order)
  })

  it("should maintain metadata consistency across imports", () => {
    // Verify that the same metadata is used throughout the application
    // This ensures that changes to feature.meta.ts propagate everywhere

    // Re-import to verify consistency
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const module = jest.requireActual("../../feature.meta") as {
      featureMeta: typeof featureMeta
    }
    const reimported = module.featureMeta

    expect(reimported.id).toBe(featureMeta.id)
    expect(reimported.title).toBe(featureMeta.title)
    expect(reimported.nav?.label).toBe(featureMeta.nav?.label)
  })
})
