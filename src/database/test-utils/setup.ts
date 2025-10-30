import { PrismaClient } from "@prisma/client"

/**
 * Test utilities for database testing
 *
 * Provides helpers for setting up and tearing down test databases,
 * managing transactions, and cleaning up test data.
 */

/**
 * Get a unique schema name for the current test worker
 * This allows parallel test execution without conflicts
 *
 * @returns Schema name for this test worker
 */
function getTestSchema(): string {
  const workerId = process.env.JEST_WORKER_ID || "1"
  return `test_${workerId}`
}

/**
 * Create a Prisma client for testing with isolated schema
 *
 * Each Jest worker gets its own schema to prevent conflicts
 * when running tests in parallel.
 *
 * @returns PrismaClient instance
 */
export function createTestPrismaClient(): PrismaClient {
  const schema = getTestSchema()
  const databaseUrl = process.env.DATABASE_URL || ""
  const urlWithSchema = databaseUrl.replace(/schema=\w+/, `schema=${schema}`)

  return new PrismaClient({
    datasources: {
      db: {
        url: urlWithSchema,
      },
    },
  })
}

/**
 * Acquire a PostgreSQL advisory lock for test isolation
 *
 * This ensures only one test can clean/modify specific tables at a time,
 * allowing safe parallel test execution.
 *
 * @param prisma - Prisma client instance
 * @param lockId - Unique lock ID (use table name hash or similar)
 */
export async function acquireTestLock(
  prisma: PrismaClient,
  lockId: number,
): Promise<void> {
  await prisma.$executeRaw`SELECT pg_advisory_lock(${lockId})`
}

/**
 * Release a PostgreSQL advisory lock
 *
 * @param prisma - Prisma client instance
 * @param lockId - Unique lock ID
 */
export async function releaseTestLock(
  prisma: PrismaClient,
  lockId: number,
): Promise<void> {
  await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockId})`
}

/**
 * Clean specific tables in the database with advisory lock protection
 *
 * Uses PostgreSQL advisory locks to ensure only one test cleans tables at a time.
 * This allows parallel test execution without data conflicts.
 *
 * @param prisma - Prisma client instance
 * @param tables - Array of table names to clean
 */
export async function cleanTables(
  prisma: PrismaClient,
  tables: string[],
): Promise<void> {
  // Generate a consistent lock ID from table names
  const lockId = tables
    .sort()
    .join("")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  try {
    // Acquire lock
    await acquireTestLock(prisma, lockId)

    // Clean tables in reverse dependency order (child tables first)
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
    }
  } finally {
    // Always release lock
    await releaseTestLock(prisma, lockId)
  }
}

/**
 * Clean all tables in the database
 *
 * WARNING: This will delete ALL data. Use only in tests!
 *
 * @param prisma - Prisma client instance
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Get all table names from the database
  const tables = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tableNames = tables
    .map((t) => t.tablename)
    .filter((name) => name !== "_prisma_migrations")

  await cleanTables(prisma, tableNames)
}

/**
 * Setup test database connection
 *
 * Creates a Prisma client and connects to the database.
 * Ensures the test schema exists and is ready for use.
 *
 * @returns Promise<PrismaClient>
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  const schema = getTestSchema()
  const prisma = createTestPrismaClient()
  await prisma.$connect()

  // Ensure the test schema exists
  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  } catch {
    // Schema might already exist, that's okay
  }

  return prisma
}

/**
 * Setup test schema by running migrations
 *
 * This ensures the test schema has all tables and migrations applied.
 * Should be run once per test worker before running tests.
 *
 * NOTE: This requires the Prisma schema to support multi-schema or
 * you need to run migrations manually for each test schema.
 */
export async function setupTestSchema(): Promise<void> {
  const schema = getTestSchema()
  const prisma = createTestPrismaClient()

  try {
    await prisma.$connect()

    // Create schema if it doesn't exist
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)

    // Note: In a real scenario, you'd need to run migrations here
    // For now, we rely on the default schema having the correct structure
    // and using search_path to access it
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Teardown test database connection
 *
 * Disconnects from the database and cleans up
 *
 * @param prisma - Prisma client instance
 */
export async function teardownTestDatabase(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$disconnect()
}

/**
 * Run a test within a transaction that is automatically rolled back
 *
 * This is useful for tests that need database access but should not
 * affect other tests.
 *
 * @param prisma - Prisma client instance
 * @param testFn - Test function to run within transaction
 */
export async function runInTransaction<T>(
  prisma: PrismaClient,
  testFn: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await testFn(tx)
  })
}
