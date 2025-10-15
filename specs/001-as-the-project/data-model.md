# Data Model: Component-scoped features

No persistence entities. Compile-time data shapes used for validation and navigation.

## Entities

- Feature
  - id: string (unique)
  - title: string
  - description?: string
  - routes: RouteDefinition[]
  - nav?: { label: string; order?: number }
  - folderPath: string

- RouteDefinition
  - path: string (unique across features)
  - title: string
  - isPrimary?: boolean (default false)

- NavigationEntry
  - label: string
  - path: string (primary route only)
  - order?: number

- ValidationIssue
  - featureId: string
  - severity: 'error' | 'warning'
  - message: string
  - filePath?: string
  - field?: string

## Relationships

- One Feature has many RouteDefinition
- Zero or one NavigationEntry per Feature (only if nav present and primary route specified)

## Derived Rules

- Exactly one primary route recommended; if multiple `isPrimary=true` found, validation error.
- Route paths must be unique across all features.
- Navigation entries sorted by (order ascending, then label ascending) with undefined order appended last.
