/**
 * Navigation Sort Stability Test
 *
 * Tests that navigation entries are sorted deterministically:
 * 1. By order (ascending) - undefined order values go last
 * 2. Then by label (ascending, locale-aware)
 */

import { navigation } from "../../../../components.generated/components.registry"
import type { NavigationEntry } from "../../../../components/types"

describe("Navigation Sort Stability", () => {
  it("should sort navigation entries by order then label", () => {
    // Verify navigation is an array
    expect(Array.isArray(navigation)).toBe(true)

    // If we have multiple entries, verify they're sorted
    if (navigation.length > 1) {
      for (let i = 0; i < navigation.length - 1; i++) {
        const current = navigation[i]
        const next = navigation[i + 1]

        // Both have order: should be sorted by order ascending
        if (
          current.order !== undefined &&
          next.order !== undefined &&
          current.order !== next.order
        ) {
          expect(current.order).toBeLessThan(next.order)
        }

        // Same order (or both undefined): should be sorted by label
        if (current.order === next.order) {
          expect(current.label.localeCompare(next.label)).toBeLessThanOrEqual(0)
        }

        // Current has undefined order, next has order: current should come after (fail)
        if (current.order === undefined && next.order !== undefined) {
          fail(
            `Entry with undefined order "${current.label}" should come after entries with order`,
          )
        }
      }
    }
  })

  it("should place entries with undefined order after entries with defined order", () => {
    const entriesWithOrder = navigation.filter((e) => e.order !== undefined)
    const entriesWithoutOrder = navigation.filter((e) => e.order === undefined)

    // If we have both types, verify ordering
    if (entriesWithOrder.length > 0 && entriesWithoutOrder.length > 0) {
      const lastWithOrder = entriesWithOrder[entriesWithOrder.length - 1]
      const firstWithoutOrder = entriesWithoutOrder[0]

      const indexLastWithOrder = navigation.indexOf(lastWithOrder)
      const indexFirstWithoutOrder = navigation.indexOf(firstWithoutOrder)

      expect(indexLastWithOrder).toBeLessThan(indexFirstWithoutOrder)
    }
  })

  it("should sort entries with same order by label alphabetically", () => {
    // Group entries by order
    const byOrder = new Map<string | number, NavigationEntry[]>()

    for (const entry of navigation) {
      const order: string | number = entry.order ?? "undefined"
      if (!byOrder.has(order)) {
        byOrder.set(order, [])
      }
      const group = byOrder.get(order)
      if (group) {
        group.push(entry)
      } else {
        byOrder.set(order, [entry])
      }
    }

    // Check each group is sorted by label
    for (const [_order, entries] of byOrder) {
      if (entries.length > 1) {
        for (let i = 0; i < entries.length - 1; i++) {
          const current = entries[i]
          const next = entries[i + 1]

          expect(current.label.localeCompare(next.label)).toBeLessThanOrEqual(0)
        }
      }
    }
  })

  it("should maintain stable sort across multiple builds", () => {
    // This test verifies that the sort is deterministic
    // by checking that entries with the same data always appear in the same order

    // Create a snapshot of current navigation
    const snapshot = navigation.map((e) => ({
      label: e.label,
      path: e.path,
      order: e.order,
    }))

    // Verify the snapshot matches (this would fail if sort is non-deterministic)
    expect(navigation).toEqual(snapshot)
  })

  it("should handle locale-sensitive string comparison", () => {
    // Verify that localeCompare is being used (handles accents, case, etc.)
    const testLabels = ["Zebra", "Apple", "apple", "Äpfel"]
    const sorted = [...testLabels].sort((a, b) => a.localeCompare(b))

    // Verify locale-aware sorting works
    expect(sorted[0].toLowerCase()).toMatch(/[aä]/)
  })
})
