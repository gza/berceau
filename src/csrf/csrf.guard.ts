/**
 * CSRF Guard
 *
 * Feature: 003-provide-an-easy
 * User Story 2: Server-Side Validation
 * Date: 2025-10-26
 *
 * NestJS guard for automatic CSRF token validation.
 * Validates tokens on all unsafe HTTP methods (POST, PUT, PATCH, DELETE).
 * Safe methods (GET, HEAD, OPTIONS) and routes with @SkipCsrf() decorator are exempt.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { SKIP_CSRF_KEY } from "./constants"
import { CsrfService } from "./csrf.service"
import { CsrfValidationFailureReason } from "./types"

/**
 * Request interface for TypeScript type safety
 */
interface RequestWithSession {
  session?: Record<string, unknown>
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, string | string[] | undefined>
  method?: string
  path?: string
}

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name)
  private readonly safeMethods = new Set(["GET", "HEAD", "OPTIONS"])

  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Determine if the request can activate the route.
   * Validates CSRF tokens for unsafe HTTP methods.
   *
   * @param context - Execution context containing request information
   * @returns Promise<boolean> - True if request is allowed, throws ForbiddenException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>()
    const method = request.method?.toUpperCase() || "GET"
    const path = request.path || "unknown"

    // Check if route has @SkipCsrf() decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipCsrf) {
      this.logger.debug(`CSRF validation skipped for ${method} ${path}`)
      return true
    }

    // Safe methods don't require CSRF validation
    if (this.safeMethods.has(method)) {
      return true
    }

    // Validate CSRF token for unsafe methods
    const validationResult = this.csrfService.validateToken(request)

    if (validationResult.isValid) {
      return true
    }

    // Token validation failed - log and throw exception
    const errorMessage = this.getErrorMessage(validationResult.reason)

    this.logger.warn(
      `CSRF validation failed for ${method} ${path}: ${validationResult.reason}`,
      {
        reason: validationResult.reason,
        method,
        path,
        timestamp: validationResult.timestamp,
        sessionPresent: validationResult.sessionPresent,
        tokenPresent: validationResult.tokenPresent,
      },
    )

    throw new ForbiddenException(errorMessage)
  }

  /**
   * Map validation failure reasons to user-friendly error messages
   *
   * @param reason - The reason for validation failure
   * @returns User-friendly error message
   */
  private getErrorMessage(
    reason: CsrfValidationFailureReason | undefined,
  ): string {
    switch (reason) {
      case CsrfValidationFailureReason.NO_SESSION:
        return "CSRF validation failed: No session found. Please ensure cookies are enabled."

      case CsrfValidationFailureReason.NO_SESSION_TOKEN:
        return "CSRF validation failed: No CSRF token in session. Please reload the page."

      case CsrfValidationFailureReason.NO_REQUEST_TOKEN:
        return "CSRF validation failed: CSRF token missing from request. Please include the token in your form or request headers."

      case CsrfValidationFailureReason.TOKEN_MISMATCH:
        return "CSRF validation failed: Invalid or expired CSRF token. Please reload the page and try again."

      case CsrfValidationFailureReason.INVALID_TOKEN_FORMAT:
        return "CSRF validation failed: Invalid token format."

      default:
        return "CSRF validation failed: Security token validation error."
    }
  }
}
