/**
 * Type definitions for component metadata shape
 *
 * These types define the structure of component metadata used throughout
 * the components discovery and registration system.
 */

/**
 * Defines a single route within a component
 */
export type RouteDefinition = {
  /** URL path for this route (e.g., '/demo', '/users') */
  path: string
  /** Human-readable title for the route */
  title: string
  /** Whether this is the primary route for the component (used for navigation) */
  isPrimary?: boolean
}

/**
 * Metadata describing a component
 */
export type ComponentMeta = {
  /** Unique identifier for the component (must match folder name convention) */
  id: string
  /** Human-readable title for the component */
  title: string
  /** Optional description of the component */
  description?: string
  /** Array of routes exposed by this component */
  routes: RouteDefinition[]
  /** Optional navigation configuration */
  nav?: {
    /** Label to display in navigation menu */
    label: string
    /** Sort order for navigation (lower numbers appear first) */
    order?: number
  }
}

/**
 * Computed navigation entry for a component
 * Generated from ComponentMeta during discovery
 */
export type NavigationEntry = {
  /** Label to display in navigation menu */
  label: string
  /** URL path (from primary route) */
  path: string
  /** Sort order (undefined entries appear last) */
  order?: number
}

/**
 * Validation issue discovered during component discovery
 */
export type ValidationIssue = {
  /** ID of the component with the issue */
  featureId: string
  /** Severity level */
  severity: "error" | "warning"
  /** Human-readable description of the issue */
  message: string
  /** Optional file path where the issue was found */
  filePath?: string
  /** Optional field name related to the issue */
  field?: string
}

/**
 * Complete component information including metadata and file location
 */
export type Component = ComponentMeta & {
  /** Absolute path to the component folder */
  folderPath: string
}
