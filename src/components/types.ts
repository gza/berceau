/**
 * Type definitions for feature metadata shape
 *
 * These types define the structure of feature metadata used throughout
 * the feature discovery and registration system.
 */

/**
 * Defines a single route within a feature
 */
export type RouteDefinition = {
  /** URL path for this route (e.g., '/demo', '/users') */
  path: string
  /** Human-readable title for the route */
  title: string
  /** Whether this is the primary route for the feature (used for navigation) */
  isPrimary?: boolean
}

/**
 * Metadata describing a feature
 */
export type FeatureMeta = {
  /** Unique identifier for the feature (must match folder name convention) */
  id: string
  /** Human-readable title for the feature */
  title: string
  /** Optional description of the feature */
  description?: string
  /** Array of routes exposed by this feature */
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
 * Computed navigation entry for a feature
 * Generated from FeatureMeta during discovery
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
 * Validation issue discovered during feature discovery
 */
export type ValidationIssue = {
  /** ID of the feature with the issue */
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
 * Complete feature information including metadata and file location
 */
export type Feature = FeatureMeta & {
  /** Absolute path to the feature folder */
  folderPath: string
}
