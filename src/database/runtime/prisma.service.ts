import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

/**
 * Prisma Service for NestJS
 *
 * This service extends PrismaClient and integrates with NestJS lifecycle hooks
 * to manage database connections. It should be registered as a global provider
 * so it can be injected throughout the application.
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
