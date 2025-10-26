/**
 * CSRF Service
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * Core service for CSRF token generation, validation, and management.
 * Implements the Synchronizer Token Pattern with server-side session storage.
 */

import { Injectable } from "@nestjs/common"
import { randomBytes, timingSafeEqual } from "crypto"
import { DEFAULT_CSRF_CONFIG } from "./constants"
import type {
  CsrfConfig,
  CsrfTokenLocation,
  CsrfTokenValue,
  CsrfValidationFailureReason,
  CsrfValidationResult,
  ICsrfService,
} from "./types"

/**
 * Session interface for TypeScript type safety
 */
interface SessionData {
  [key: string]: unknown
}

/**
 * Request interface for TypeScript type safety
 */
interface RequestWithSession {
  session?: SessionData
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, string | string[] | undefined>
  method?: string
}

@Injectable()
export class CsrfService implements ICsrfService {
  private config: CsrfConfig

  constructor() {
    // Initialize with default configuration
    // Configuration can be overridden via CsrfModule.forRoot()
    this.config = { ...DEFAULT_CSRF_CONFIG }
  }

  /**
   * Set configuration for the CSRF service
   * Called by CsrfModule.forRoot() during module initialization
   */
  setConfig(config: Partial<CsrfConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Generate a new CSRF token for the given session.
   * If a token already exists in the session, returns the existing token.
   *
   * @param session - Express session object
   * @returns The CSRF token value
   *
   * @example
   * ```typescript
   * const token = csrfService.generateToken(req.session);
   * ```
   */
  generateToken(session: unknown): CsrfTokenValue {
    const sessionData = session as SessionData

    // Return existing token if present
    const existingToken = sessionData[this.config.sessionKey]
    if (typeof existingToken === "string" && existingToken.length > 0) {
      return existingToken
    }

    // Generate new cryptographically secure token
    const token = randomBytes(this.config.tokenLength).toString("hex")

    // Store in session
    sessionData[this.config.sessionKey] = token

    return token
  }

  /**
   * Get the current CSRF token from the session without generating a new one.
   *
   * @param session - Express session object
   * @returns The CSRF token value, or undefined if no token exists
   *
   * @example
   * ```typescript
   * const token = csrfService.getToken(req.session);
   * if (!token) {
   *   // No token exists yet
   * }
   * ```
   */
  getToken(session: unknown): CsrfTokenValue | undefined {
    const sessionData = session as SessionData
    const token = sessionData[this.config.sessionKey]

    return typeof token === "string" ? token : undefined
  }

  /**
   * Extract CSRF token from request (body, headers, or query string).
   *
   * Priority order:
   * 1. Request body (_csrf field)
   * 2. HTTP header (x-csrf-token)
   * 3. Query parameter (_csrf)
   *
   * @param request - Express request object
   * @returns Token value and location, or undefined if not found
   *
   * @example
   * ```typescript
   * const token = csrfService.extractTokenFromRequest(request);
   * if (token) {
   *   console.log(`Token found in ${token.location}: ${token.value}`);
   * }
   * ```
   */
  extractTokenFromRequest(
    request: unknown,
  ): { value: CsrfTokenValue; location: CsrfTokenLocation } | undefined {
    const req = request as RequestWithSession

    // Check body first
    if (req.body && typeof req.body[this.config.fieldName] === "string") {
      return {
        value: req.body[this.config.fieldName] as string,
        location: "body",
      }
    }

    // Check headers (lowercase - Express normalizes headers)
    if (req.headers) {
      const headerValue = req.headers[this.config.headerName]
      if (typeof headerValue === "string") {
        return {
          value: headerValue,
          location: "header",
        }
      }
    }

    // Check query string
    if (req.query && typeof req.query[this.config.fieldName] === "string") {
      return {
        value: req.query[this.config.fieldName] as string,
        location: "query",
      }
    }

    return undefined
  }

  /**
   * Validate a CSRF token from a request against the session token.
   *
   * Uses constant-time comparison to prevent timing attacks.
   *
   * @param request - Express request object
   * @returns Validation result object
   *
   * @example
   * ```typescript
   * const result = csrfService.validateToken(request);
   * if (!result.isValid) {
   *   throw new ForbiddenException(result.reason);
   * }
   * ```
   */
  validateToken(request: unknown): CsrfValidationResult {
    const req = request as RequestWithSession
    const timestamp = new Date()

    // Check if session exists
    if (!req.session) {
      return {
        isValid: false,
        reason: "NO_SESSION" as CsrfValidationFailureReason,
        tokenPresent: false,
        sessionPresent: false,
        timestamp,
      }
    }

    // Get session token
    const sessionToken = this.getToken(req.session)
    if (!sessionToken) {
      return {
        isValid: false,
        reason: "NO_SESSION_TOKEN" as CsrfValidationFailureReason,
        tokenPresent: false,
        sessionPresent: true,
        timestamp,
      }
    }

    // Extract token from request
    const requestTokenData = this.extractTokenFromRequest(request)
    if (!requestTokenData) {
      return {
        isValid: false,
        reason: "NO_REQUEST_TOKEN" as CsrfValidationFailureReason,
        tokenPresent: false,
        sessionPresent: true,
        timestamp,
      }
    }

    const requestToken = requestTokenData.value

    // Compare tokens using constant-time comparison to prevent timing attacks
    try {
      const sessionBuffer = Buffer.from(sessionToken, "utf8")
      const requestBuffer = Buffer.from(requestToken, "utf8")

      // Tokens must be same length for timingSafeEqual
      if (sessionBuffer.length !== requestBuffer.length) {
        return {
          isValid: false,
          reason: "TOKEN_MISMATCH" as CsrfValidationFailureReason,
          tokenPresent: true,
          sessionPresent: true,
          timestamp,
        }
      }

      const tokensMatch = timingSafeEqual(sessionBuffer, requestBuffer)

      if (!tokensMatch) {
        return {
          isValid: false,
          reason: "TOKEN_MISMATCH" as CsrfValidationFailureReason,
          tokenPresent: true,
          sessionPresent: true,
          timestamp,
        }
      }

      // Validation passed
      return {
        isValid: true,
        tokenPresent: true,
        sessionPresent: true,
        timestamp,
      }
    } catch {
      // If comparison fails for any reason, treat as mismatch
      return {
        isValid: false,
        reason: "TOKEN_MISMATCH" as CsrfValidationFailureReason,
        tokenPresent: true,
        sessionPresent: true,
        timestamp,
      }
    }
  }

  /**
   * Get the configured field name for CSRF tokens in forms.
   *
   * @returns The field name (default: '_csrf')
   *
   * @example
   * ```typescript
   * const fieldName = csrfService.getFieldName(); // '_csrf'
   * ```
   */
  getFieldName(): string {
    return this.config.fieldName
  }

  /**
   * Get the configured header name for CSRF tokens in AJAX requests.
   *
   * @returns The header name (default: 'X-CSRF-Token')
   *
   * @example
   * ```typescript
   * const headerName = csrfService.getHeaderName(); // 'X-CSRF-Token'
   * ```
   */
  getHeaderName(): string {
    // Return with standard capitalization for documentation/display
    // Note: Express automatically lowercases headers, so 'x-csrf-token' in config
    // is correct for actual header matching
    return this.config.headerName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("-")
  }
}
