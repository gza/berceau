/**
 * Database Module
 *
 * This is a global module that provides the PrismaService to all modules in the application.
 * By marking it as @Global(), we don't need to import it in every module that needs database access.
 */

import { Module, Global } from "@nestjs/common"
import { PrismaService } from "./prisma.service"

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
