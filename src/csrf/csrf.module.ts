/**
 * CSRF Module
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * NestJS module for CSRF protection services.
 * Provides CsrfService with configurable options via forRoot() static method.
 * Registers CsrfGuard globally for automatic CSRF validation.
 */

import type { DynamicModule } from "@nestjs/common"
import { Global, Module } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { DEFAULT_CSRF_CONFIG } from "./constants"
import { CsrfGuard } from "./csrf.guard"
import { CsrfService } from "./csrf.service"
import type { CsrfModuleOptions } from "./types"

@Global()
@Module({})
export class CsrfModule {
  /**
   * Register the CSRF module with optional configuration.
   *
   * @param options - Configuration options for CSRF protection
   * @returns Dynamic module with configured CsrfService
   *
   * @example
   * ```typescript
   * // In app.module.ts
   * @Module({
   *   imports: [
   *     CsrfModule.forRoot({
   *       tokenLength: 32,
   *       fieldName: '_csrf',
   *       headerName: 'x-csrf-token',
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options: CsrfModuleOptions = {}): DynamicModule {
    // Merge provided options with defaults
    const config = {
      ...DEFAULT_CSRF_CONFIG,
      ...options,
    }

    return {
      module: CsrfModule,
      providers: [
        {
          provide: CsrfService,
          useFactory: () => {
            const service = new CsrfService()
            service.setConfig(config)
            return service
          },
        },
        {
          provide: APP_GUARD,
          useClass: CsrfGuard,
        },
      ],
      exports: [CsrfService],
      global: true,
    }
  }
}
