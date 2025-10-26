/**
 * Constants for CSRF Protection
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * This file defines constants used throughout the CSRF protection system.
 */

import type { CsrfConfig, SafeHttpMethod } from "./types"

/**
 * Default configuration for CSRF protection
 * Following OWASP recommendations for secure defaults
 */
export const DEFAULT_CSRF_CONFIG: CsrfConfig = {
  // 256-bit tokens (32 bytes)
  tokenLength: 32,

  // Session storage key
  sessionKey: "_csrf",

  // HTML form field name
  fieldName: "_csrf",

  // HTTP header name (lowercase - Express normalizes headers)
  headerName: "x-csrf-token",

  // Session cookie name
  cookieName: "connect.sid",

  // HTTP methods that bypass CSRF validation
  safeMethods: ["GET", "HEAD", "OPTIONS"] as readonly SafeHttpMethod[],
}

/**
 * Metadata key for the @SkipCsrf() decorator
 * Used by Reflector to check if CSRF validation should be skipped
 */
export const SKIP_CSRF_KEY = "skipCsrf"

/**
 * Minimum token length in bytes (128 bits per OWASP)
 */
export const MIN_TOKEN_LENGTH = 16

/**
 * Maximum token length in bytes (for validation)
 */
export const MAX_TOKEN_LENGTH = 64

/**
 * Regular expression for validating token format (hex string)
 */
export const TOKEN_FORMAT_REGEX = /^[0-9a-f]+$/i
