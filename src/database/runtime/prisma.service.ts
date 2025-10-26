import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

/**
 * Get the database URL with test schema isolation when running in Jest
 *
 * @returns Database URL string
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL || ""
  const workerId = process.env.JEST_WORKER_ID

  // If not in test environment, use default URL
  if (!workerId) {
    return databaseUrl
  }

  // In test environment, use isolated schema per worker
  const testSchema = `test_${workerId}`
  if (databaseUrl.includes("schema=")) {
    return databaseUrl.replace(/schema=\w+/, `schema=${testSchema}`)
  } else {
    const separator = databaseUrl.includes("?") ? "&" : "?"
    return `${databaseUrl}${separator}schema=${testSchema}`
  }
}

/**
 * Prisma Service for NestJS
 *
 * This service extends PrismaClient and integrates with NestJS lifecycle hooks
 * to manage database connections. It should be registered as a global provider
 * so it can be injected throughout the application.
 *
 * In test environments (when JEST_WORKER_ID is present), automatically uses
 * schema isolation to allow parallel test execution without conflicts.
 *
 * Usage:
 * ```typescript
 * constructor(private readonly prisma: PrismaService) {}
 *
 * async findUsers() {
 *   return this.prisma.user.findMany();
 * }
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const datasourceUrl = getDatabaseUrl()
    super({
      datasources: {
        db: {
          url: datasourceUrl,
        },
      },
    })

    if (process.env.JEST_WORKER_ID) {
      this.logger.log(
        `Test mode: Using isolated schema test_${process.env.JEST_WORKER_ID}`,
      )
    }
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit() {
    this.logger.log("Connecting to database...")

    await this.$connect()
    this.logger.log("Database connected successfully")
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    this.logger.log("Disconnecting from database...")

    await this.$disconnect()
    this.logger.log("Database disconnected")
  }
}
