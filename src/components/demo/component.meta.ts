/**
 * Demo Component Metadata
 *
 * This is an example component demonstrating the drop-in component pattern.
 */

import type { ComponentMeta } from "../types"

export const componentMeta: ComponentMeta = {
  id: "demo",
  title: "Demo Component",
  description: "A demonstration of the drop-in component system",
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
