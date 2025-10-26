/**
 * CSRF Decorator
 *
 * Feature: 003-provide-an-easy
 * User Story 4: Flexible Opt-Out for APIs
 * Date: 2025-10-26
 *
 * Decorator to skip CSRF validation for specific routes.
 */

import { SetMetadata } from "@nestjs/common"
import { SKIP_CSRF_KEY } from "./constants"

/**
 * Decorator to skip CSRF validation for a route or controller.
 *
 * **⚠️ SECURITY WARNING**: Routes using this decorator MUST implement
 * alternative authentication mechanisms such as:
 * - OAuth 2.0 tokens
 * - JWT (JSON Web Tokens)
 * - API keys with proper rotation
 * - Session-based authentication with other protections
 *
 * Use this decorator only for:
 * - JSON APIs that use token-based authentication
 * - Webhook endpoints with signature verification
 * - Public read-only endpoints
 *
 * DO NOT use for form-based endpoints or routes handling sensitive operations.
 *
 * @example
 * ```typescript
 * // API endpoint with JWT authentication
 * @Post('api/data')
 * @SkipCsrf()
 * @UseGuards(JwtAuthGuard)
 * async createData(@Body() data: CreateDataDto) {
 *   return this.dataService.create(data);
 * }
 *
 * // Webhook endpoint with signature verification
 * @Post('webhooks/github')
 * @SkipCsrf()
 * async handleWebhook(@Body() payload: any, @Headers('x-hub-signature') signature: string) {
 *   this.webhookService.verifySignature(payload, signature);
 *   return this.webhookService.process(payload);
 * }
 * ```
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true)
