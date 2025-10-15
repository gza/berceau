/**
 * Demonstration: Build Blocking Behavior
 *
 * This test demonstrates how validation severity affects build behavior.
 */

describe("Build Blocking: Severity Levels", () => {
  it("explains that errors block webpack compilation", () => {
    // When severity === 'error':
    // 1. Error is added to validationErrors array
    // 2. Plugin filters for errors: .filter(e => e.severity === 'error')
    // 3. If any errors exist: callback(new Error(...))
    // 4. Webpack compilation fails with exit code 1
    // 5. HMR is blocked until errors are fixed
    // 6. CI/CD fails and doesn't deploy

    expect(true).toBe(true)
  })

  it("explains that warnings don't block webpack compilation", () => {
    // When severity === 'warning':
    // 1. Warning is added to validationErrors array
    // 2. Plugin filters for errors: .filter(e => e.severity === 'error')
    // 3. Warning is NOT included in errorMessages
    // 4. Plugin continues: generates files and calls callback() successfully
    // 5. Webpack compilation succeeds with exit code 0
    // 6. HMR applies updates normally
    // 7. CI/CD proceeds to deployment

    expect(true).toBe(true)
  })

  it("demonstrates current behavior for missing primary route", () => {
    // Current implementation:
    // - Severity: 'warning'
    // - Build: ✅ Succeeds
    // - Console: ⚠️ WARNING: Feature 'demo' has 'nav' but no primary route
    // - Behavior: Uses first route as fallback
    // - Rationale: This is a valid configuration, just potentially unclear

    expect(true).toBe(true)
  })

  it("demonstrates behavior if changed to error", () => {
    // If changed to severity: 'error':
    // - Severity: 'error'
    // - Build: ❌ Fails
    // - Console: ❌ ERROR: Feature 'demo' has 'nav' but no primary route
    // - Behavior: Build stops, developer must fix before continuing
    // - Rationale: Forces explicit primary route declaration

    expect(true).toBe(true)
  })
})

describe("Build Blocking: Configuration Philosophy", () => {
  it("explains when to use errors vs warnings", () => {
    // Use ERROR when:
    // - Configuration is ambiguous or invalid
    // - Will cause runtime issues
    // - Violates architectural constraints (duplicate IDs, routes)
    // - Required fields are missing

    // Use WARNING when:
    // - Configuration is valid but potentially unclear
    // - System has a sensible fallback behavior
    // - Developer should be informed but not blocked
    // - Best practice recommendation (not requirement)

    expect(true).toBe(true)
  })

  it("explains the current design decision", () => {
    // "Nav without primary" is currently a WARNING because:
    // ✅ Valid: System uses first route (sensible fallback)
    // ✅ Predictable: Behavior is documented and tested
    // ✅ Flexible: Allows simple single-route features
    // ⚠️ Informative: Developer is warned about implicit behavior

    // Could be changed to ERROR if:
    // ❌ Team wants to enforce explicit primary declarations
    // ❌ Implicit behavior causes confusion in practice
    // ❌ Code review standards require isPrimary

    expect(true).toBe(true)
  })
})

describe("Build Blocking: How to Change Severity", () => {
  it("shows location to modify in plugin", () => {
    // File: build/feature-discovery-plugin.js
    // Method: validateFeatures()
    // Section: "Validate nav configuration if present"
    // Line: ~254 (look for "severity: 'warning'")

    // Change from:
    //   severity: 'warning',

    // To:
    //   severity: 'error',

    // Then rebuild and the validation will block builds

    expect(true).toBe(true)
  })

  it("shows example of strict validation", () => {
    // If you want STRICT mode (all nav must have explicit primary):

    const strictValidation = {
      featureId: "demo",
      severity: "error", // ← Changed from 'warning'
      message:
        "Feature 'demo' has 'nav' but no primary route. Explicitly mark one route with isPrimary: true",
      filePath: "/path/to/feature.meta.ts",
      field: "routes[].isPrimary",
    }

    expect(strictValidation.severity).toBe("error")
  })
})
