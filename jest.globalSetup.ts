/**
 * Jest Global Setup
 *
 * This file runs once before all tests to set up test database schemas.
 * Each Jest worker will get its own isolated schema with migrations applied.
 */

import { PrismaClient } from "@prisma/client"

export default async function globalSetup() {
  console.log("🔧 Setting up test database schemas...")

  // Read number of workers from JEST_WORKERS env var (set in package.json)
  if (!process.env.JEST_WORKERS) {
    throw new Error(
      "JEST_WORKERS environment variable is required. " +
      "Set it in package.json test script, e.g.: JEST_WORKERS=8 jest --maxWorkers=$JEST_WORKERS"
    )
  }

  const maxWorkers = parseInt(process.env.JEST_WORKERS, 10)

  if (isNaN(maxWorkers) || maxWorkers < 1) {
    throw new Error(
      `JEST_WORKERS must be a positive number, got: ${process.env.JEST_WORKERS}`
    )
  }

  console.log(`  Preparing ${maxWorkers} test schema(s)`)


  const databaseUrl = process.env.DATABASE_URL || ""
  const migrationUrl = process.env.MIGRATION_DATABASE_URL || databaseUrl

  // Connect with admin privileges to create schemas
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: migrationUrl,
      },
    },
  })

  try {
    await prisma.$connect()

    // Get the application user from DATABASE_URL
    const userMatch = databaseUrl.match(/postgresql:\/\/([^:]+):/)
    const appUser = userMatch ? userMatch[1] : "berceau"

    // Create test schemas for each worker
    for (let workerId = 1; workerId <= maxWorkers; workerId++) {
      const schemaName = `test_${workerId}`
      console.log(`  Creating schema: ${schemaName}`)

      // Drop schema if it exists (clean slate for tests)
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      )

      // Create the schema
      await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`)

      // Grant full permissions to the application user on this schema
      await prisma.$executeRawUnsafe(
        `GRANT ALL ON SCHEMA "${schemaName}" TO ${appUser}`,
      )
      await prisma.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "${schemaName}" TO ${appUser}`,
      )
      await prisma.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "${schemaName}" TO ${appUser}`,
      )
      await prisma.$executeRawUnsafe(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT ALL ON TABLES TO ${appUser}`,
      )
      await prisma.$executeRawUnsafe(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT ALL ON SEQUENCES TO ${appUser}`,
      )

      console.log(`  Granted permissions to ${appUser} on ${schemaName}`)

      // Copy schema structure using pg_dump
      // We can't use Prisma migrations because they check _prisma_migrations table
      // and see migrations as already applied (from public schema)
      console.log(`  Copying schema structure to ${schemaName}...`)

      try {
        const { execSync } = await import("child_process")

        // Extract connection details from migrationUrl
        const urlMatch = migrationUrl.match(
          /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/,
        )
        if (!urlMatch) {
          throw new Error("Failed to parse database URL")
        }

        const [, user, password, host, port, database] = urlMatch

        // Use pg_dump to dump only the schema structure (no data) from public schema
        // Then restore it to the test schema with schema replacement
        const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -n public --schema-only --no-owner --no-privileges`
        
        const schemaDump = execSync(dumpCommand, {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        })

        // Replace 'public.' with 'schemaName.' and filter out schema creation
        let modifiedDump = schemaDump
          // Remove CREATE SCHEMA statements (we already created the schema)
          .replace(/CREATE SCHEMA [^;]+;/g, "")
          // Replace schema references
          .replace(/\bpublic\./g, `${schemaName}.`)
          // Replace SET search_path
          .replace(/SET search_path = public/g, `SET search_path = ${schemaName}`)
          // Skip _prisma_migrations table
          .split("\n")
          .filter((line) => !line.includes("_prisma_migrations"))
          .join("\n")

        // Execute the modified dump to create objects in test schema
        const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database}`
        
        execSync(restoreCommand, {
          input: modifiedDump,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        })

        console.log(`  Successfully copied schema structure to ${schemaName}`)
      } catch (error) {
        console.error(`  ⚠️  Error copying schema:`, error)
        throw error
      }
    }

    console.log("✅ Test database schemas ready!")
  } finally {
    await prisma.$disconnect()
  }
}
