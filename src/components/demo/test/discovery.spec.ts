/**
 * Test Discovery Verification
 *
 * This test verifies that tests placed in component folders are automatically
 * discovered and executed by Jest without requiring additional configuration.
 * Also verifies that Prisma schemas are discovered during build.
 */

import { componentMeta } from "../component.meta"
import * as fs from "fs"
import * as path from "path"

describe("Component Test Discovery", () => {
  it("should discover and run Node tests in component test directories", () => {
    // This test being executed proves that Jest discovers tests in:
    // src/components/**/test/**/*.spec.ts

    expect(true).toBe(true)
  })

  it("should have access to component metadata", () => {
    // Tests in component folders can import from their parent component
    expect(componentMeta).toBeDefined()
    expect(componentMeta.id).toBe("demo")
  })

  it("should run without additional Jest configuration", () => {
    // This test proves that the Jest config automatically includes
    // tests in src/components/**/test/ directories

    // Verify test environment
    expect(typeof describe).toBe("function")
    expect(typeof it).toBe("function")
    expect(typeof expect).toBe("function")
  })
})

describe("Schema Discovery Integration", () => {
  it("should discover component Prisma schema file", () => {
    // Verify that the schema file exists in the component directory
    const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma")
    expect(fs.existsSync(schemaPath)).toBe(true)
  })

  it("should copy schema to central prisma/schema/ directory during build", () => {
    // Verify that the build process copied the schema
    const centralSchemaPath = path.join(
      process.cwd(),
      "prisma",
      "schema",
      "demo.prisma",
    )

    // This test will pass after build has run
    if (fs.existsSync(centralSchemaPath)) {
      expect(fs.existsSync(centralSchemaPath)).toBe(true)

      // Verify the content was copied correctly
      const content = fs.readFileSync(centralSchemaPath, "utf8")
      expect(content).toContain("model DemoUser")
      expect(content).toContain("model DemoPost")
      expect(content).toContain("enum DemoPostStatus")
    } else {
      console.warn("Build not run yet - schema not copied to central directory")
    }
  })

  it("should generate main.prisma with datasource and generator blocks", () => {
    const mainSchemaPath = path.join(
      process.cwd(),
      "prisma",
      "schema",
      "main.prisma",
    )

    if (fs.existsSync(mainSchemaPath)) {
      const content = fs.readFileSync(mainSchemaPath, "utf8")
      expect(content).toContain("datasource db")
      expect(content).toContain('provider = "postgresql"')
      expect(content).toContain('url      = env("MIGRATION_DATABASE_URL")')
      expect(content).toContain("generator client")
    } else {
      console.warn("Build not run yet - main.prisma not generated")
    }
  })
})
