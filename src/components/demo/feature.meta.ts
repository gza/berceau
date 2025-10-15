/**
 * Demo Feature Metadata
 *
 * This is an example feature demonstrating the drop-in component pattern.
 */

import type { FeatureMeta } from "../types"

export const featureMeta: FeatureMeta = {
  id: "demo",
  title: "Demo Feature",
  description: "A demonstration of the drop-in feature system",
  routes: [
    {
      path: "/demo",
      title: "Demo Page",
      isPrimary: true,
    },
  ],
  nav: {
    label: "Demo",
    order: 100,
  },
} as const
