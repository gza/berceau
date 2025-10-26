/**
 * TypeScript Types for CSRF Protection
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * This file defines the TypeScript interfaces and types for the CSRF protection system.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * CSRF token value - a cryptographically secure random string
 */
export type CsrfTokenValue = string

/**
 * HTTP methods that do not require CSRF validation
 */
export type SafeHttpMethod = "GET" | "HEAD" | "OPTIONS"

/**
 * HTTP methods that require CSRF validation
 */
export type UnsafeHttpMethod = "POST" | "PUT" | "PATCH" | "DELETE" | "TRACE"

/**
 * All HTTP methods
 */
export type HttpMethod = SafeHttpMethod | UnsafeHttpMethod

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration options for CSRF protection module
 */
export interface CsrfModuleOptions {
  /**
   * Length of generated tokens in bytes (default: 32)
   * Minimum recommended: 16 bytes (128 bits)
   */
  tokenLength?: number

  /**
   * Key used to store CSRF token in session (default: '_csrf')
   */
  sessionKey?: string

  /**
   * HTML form field name for CSRF token (default: '_csrf')
   */
  fieldName?: string

  /**
   * HTTP header name for CSRF token (default: 'x-csrf-token')
   * Note: Express lowercases header names
   */
  headerName?: string

  /**
   * Session cookie name (default: 'connect.sid')
   */
  cookieName?: string

  /**
   * HTTP methods that bypass CSRF validation (default: GET, HEAD, OPTIONS)
   */
  safeMethods?: readonly SafeHttpMethod[]
}

/**
 * Resolved CSRF configuration with all defaults applied
 */
export interface CsrfConfig extends Required<CsrfModuleOptions> {
  safeMethods: readonly SafeHttpMethod[]
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Reasons why CSRF validation might fail
 */
export enum CsrfValidationFailureReason {
  /** Request has no session */
  NO_SESSION = "NO_SESSION",

  /** Session exists but has no CSRF token */
  NO_SESSION_TOKEN = "NO_SESSION_TOKEN",

  /** Request is missing CSRF token */
  NO_REQUEST_TOKEN = "NO_REQUEST_TOKEN",

  /** Token from request doesn't match token in session */
  TOKEN_MISMATCH = "TOKEN_MISMATCH",

  /** Token format is invalid (wrong length, invalid characters) */
  INVALID_TOKEN_FORMAT = "INVALID_TOKEN_FORMAT",
}

/**
 * Result of CSRF token validation
 */
export interface CsrfValidationResult {
  /** Whether validation passed */
  isValid: boolean

  /** Why validation failed (undefined if validation passed) */
  reason?: CsrfValidationFailureReason

  /** Whether a token was present in the request */
  tokenPresent: boolean

  /** Whether a session exists for the request */
  sessionPresent: boolean

  /** When validation was performed */
  timestamp: Date
}

/**
 * Locations where CSRF tokens can be found in requests
 */
export type CsrfTokenLocation = "body" | "query" | "header"

/**
 * Service interface for CSRF token management
 */
export interface ICsrfService {
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
  generateToken(session: unknown): CsrfTokenValue

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
  getToken(session: unknown): CsrfTokenValue | undefined

  /**
   * Validate a CSRF token from a request against the session token.
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
  validateToken(request: unknown): CsrfValidationResult

  /**
   * Extract CSRF token from request (body, headers, or query string).
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
  ): { value: CsrfTokenValue; location: CsrfTokenLocation } | undefined

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
  getFieldName(): string

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
  getHeaderName(): string
}

/**
 * Props for the CsrfToken JSX component
 */
export interface CsrfTokenProps {
  /**
   * Override the default field name (default: uses configured fieldName)
   */
  fieldName?: string

  /**
   * ID attribute for the hidden input element
   */
  id?: string

  /**
   * data-testid attribute for testing
   */
  "data-testid"?: string
}
