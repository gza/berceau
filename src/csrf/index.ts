/**
 * CSRF Protection Module - Public API
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * Barrel export file for the CSRF protection system.
 * Provides a clean public API for consuming code.
 */

// Core module
export { CsrfModule } from "./csrf.module"

// Service
export { CsrfService } from "./csrf.service"

// Guard
export { CsrfGuard } from "./csrf.guard"

// Decorator
export { SkipCsrf } from "./csrf.decorator"

// Component (for SSR)
export { CsrfToken } from "./csrf-token.component"

// Context (for SSR integration)
export {
  getRequestContext,
  runInContext,
  hasRequestContext,
} from "./csrf-context"
export type { CsrfRequestContext } from "./csrf-context"

// Types
export type {
  CsrfTokenValue,
  CsrfConfig,
  CsrfModuleOptions,
  CsrfValidationResult,
  CsrfTokenLocation,
  CsrfTokenProps,
  ICsrfService,
  SafeHttpMethod,
  UnsafeHttpMethod,
  HttpMethod,
} from "./types"
export { CsrfValidationFailureReason } from "./types"

// Constants
export { DEFAULT_CSRF_CONFIG, SKIP_CSRF_KEY } from "./constants"
