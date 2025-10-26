/**
 * TypeScript API Contracts for CSRF Protection
 * 
 * Feature: 003-provide-an-easy
 * Date: 2025-10-24
 * 
 * This file defines the TypeScript interfaces and types that constitute
 * the public API for the CSRF protection system.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * CSRF token value - a cryptographically secure random string
 */
export type CsrfTokenValue = string;

/**
 * HTTP methods that do not require CSRF validation
 */
export type SafeHttpMethod = 'GET' | 'HEAD' | 'OPTIONS';

/**
 * HTTP methods that require CSRF validation
 */
export type UnsafeHttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'TRACE';

/**
 * All HTTP methods
 */
export type HttpMethod = SafeHttpMethod | UnsafeHttpMethod;

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
  tokenLength?: number;

  /**
   * Key used to store CSRF token in session (default: '_csrf')
   */
  sessionKey?: string;

  /**
   * HTML form field name for CSRF token (default: '_csrf')
   */
  fieldName?: string;

  /**
   * HTTP header name for CSRF token (default: 'x-csrf-token')
   * Note: Express lowercases header names
   */
  headerName?: string;

  /**
   * Session cookie name (default: 'connect.sid')
   */
  cookieName?: string;

  /**
   * HTTP methods that bypass CSRF validation (default: GET, HEAD, OPTIONS)
   */
  safeMethods?: readonly SafeHttpMethod[];
}

/**
 * Resolved CSRF configuration with all defaults applied
 */
export interface CsrfConfig extends Required<CsrfModuleOptions> {
  safeMethods: readonly SafeHttpMethod[];
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Reasons why CSRF validation might fail
 */
export enum CsrfValidationFailureReason {
  /** Request has no session */
  NO_SESSION = 'NO_SESSION',
  
  /** Session exists but has no CSRF token */
  NO_SESSION_TOKEN = 'NO_SESSION_TOKEN',
  
  /** Request is missing CSRF token */
  NO_REQUEST_TOKEN = 'NO_REQUEST_TOKEN',
  
  /** Token from request doesn't match token in session */
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',
  
  /** Token format is invalid (wrong length, invalid characters) */
  INVALID_TOKEN_FORMAT = 'INVALID_TOKEN_FORMAT'
}

/**
 * Result of CSRF token validation
 */
export interface CsrfValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Why validation failed (undefined if validation passed) */
  reason?: CsrfValidationFailureReason;

  /** Whether a token was present in the request */
  tokenPresent: boolean;

  /** Whether a session exists for the request */
  sessionPresent: boolean;

  /** When validation was performed */
  timestamp: Date;
}

/**
 * Locations where CSRF tokens can be found in requests
 */
export type CsrfTokenLocation = 'body' | 'query' | 'header';

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
  generateToken(session: any): CsrfTokenValue;

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
  getToken(session: any): CsrfTokenValue | undefined;

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
  validateToken(request: any): CsrfValidationResult;

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
  extractTokenFromRequest(request: any): 
    | { value: CsrfTokenValue; location: CsrfTokenLocation }
    | undefined;
}

// ============================================================================
// Guard Interface
// ============================================================================

/**
 * NestJS Guard for CSRF protection.
 * 
 * Automatically applied to all routes via APP_GUARD provider.
 * Routes can opt out using @SkipCsrf() decorator.
 * 
 * @example
 * ```typescript
 * // Global registration in module:
 * {
 *   provide: APP_GUARD,
 *   useClass: CsrfGuard
 * }
 * ```
 */
export interface ICsrfGuard {
  /**
   * NestJS CanActivate interface implementation.
   * 
   * @param context - Execution context
   * @returns true if request should be allowed, false if rejected
   * @throws ForbiddenException if validation fails
   */
  canActivate(context: any): boolean | Promise<boolean>;
}

// ============================================================================
// Decorator Metadata
// ============================================================================

/**
 * Metadata key for @SkipCsrf() decorator
 */
export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Type definition for @SkipCsrf() decorator
 * 
 * @example
 * ```typescript
 * @Controller('api')
 * export class ApiController {
 *   @SkipCsrf()
 *   @UseGuards(JwtAuthGuard)
 *   @Post('data')
 *   create(@Body() data: CreateDto) {
 *     // ...
 *   }
 * }
 * ```
 */
export type SkipCsrfDecorator = () => MethodDecorator & ClassDecorator;

// ============================================================================
// JSX Component Interface
// ============================================================================

/**
 * Props for <CsrfToken /> JSX component
 */
export interface CsrfTokenProps {
  /**
   * Custom field name for the hidden input (defaults to configured fieldName)
   */
  fieldName?: string;

  /**
   * HTML id attribute for the input element
   */
  id?: string;

  /**
   * data-testid attribute for testing
   */
  'data-testid'?: string;
}

/**
 * Type definition for <CsrfToken /> component
 * 
 * @example
 * ```tsx
 * import { CsrfToken } from '@/csrf/csrf-token.component';
 * 
 * export function MyForm() {
 *   return (
 *     <form method="POST" action="/submit">
 *       <CsrfToken />
 *       <input type="text" name="data" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
export type CsrfTokenComponent = (props?: CsrfTokenProps) => JSX.Element;

// ============================================================================
// Context Injection (for SSR)
// ============================================================================

/**
 * Context data for CSRF token injection during SSR
 */
export interface CsrfRenderContext {
  /**
   * CSRF token to be injected into rendered page
   */
  csrfToken: CsrfTokenValue;

  /**
   * Field name for token (for meta tag)
   */
  csrfFieldName: string;
}

/**
 * Extended render options for SSR with CSRF token injection
 */
export interface RenderPageOptionsWithCsrf {
  /** Page title */
  title?: string;

  /** Script URLs to include */
  scripts?: string[];

  /** Current request path (for navigation highlighting) */
  currentPath?: string;

  /** CSRF token context (injected automatically) */
  csrf?: CsrfRenderContext;
}

// ============================================================================
// Express Session Extension
// ============================================================================

/**
 * Type extension for Express session to include CSRF token
 */
declare module 'express-session' {
  interface SessionData {
    /**
     * CSRF token stored in session
     */
    _csrf?: string;
  }
}

// ============================================================================
// Module Registration
// ============================================================================

/**
 * Dynamic module definition for CsrfModule
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     CsrfModule.forRoot({
 *       tokenLength: 32,
 *       sessionKey: '_csrf'
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
export interface CsrfModuleDefinition {
  /**
   * Register CSRF module with optional configuration
   */
  forRoot(options?: CsrfModuleOptions): any; // DynamicModule type
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Mock CSRF service for testing
 */
export interface MockCsrfService extends ICsrfService {
  /**
   * Set a predefined token for testing
   */
  setMockToken(token: CsrfTokenValue): void;

  /**
   * Reset mock state
   */
  reset(): void;
}

/**
 * Test utilities for CSRF protection
 */
export interface CsrfTestingUtils {
  /**
   * Create a mock CSRF service
   */
  createMockCsrfService(): MockCsrfService;

  /**
   * Extract CSRF token from HTML string
   */
  extractTokenFromHtml(html: string): CsrfTokenValue | null;

  /**
   * Create a request with CSRF token
   */
  createRequestWithToken(token: CsrfTokenValue, location?: CsrfTokenLocation): any;
}

// ============================================================================
// Logging & Monitoring
// ============================================================================

/**
 * Log entry for CSRF validation events
 */
export interface CsrfValidationLogEntry {
  /** Event timestamp */
  timestamp: Date;

  /** Request path */
  path: string;

  /** HTTP method */
  method: string;

  /** Session ID (anonymized) */
  sessionId?: string;

  /** Whether validation passed */
  valid: boolean;

  /** Failure reason (if applicable) */
  reason?: CsrfValidationFailureReason;

  /** Token location in request */
  tokenLocation?: CsrfTokenLocation;
}

/**
 * Metrics for CSRF protection system
 */
export interface CsrfMetrics {
  /** Total validation attempts */
  totalValidations: number;

  /** Successful validations */
  successfulValidations: number;

  /** Failed validations */
  failedValidations: number;

  /** Validations by failure reason */
  failuresByReason: Record<CsrfValidationFailureReason, number>;

  /** Average validation time (milliseconds) */
  avgValidationTime: number;

  /** Tokens generated */
  tokensGenerated: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom exception for CSRF validation failures
 */
export class CsrfValidationException extends Error {
  constructor(
    public readonly reason: CsrfValidationFailureReason,
    public readonly details?: any
  ) {
    super(`CSRF validation failed: ${reason}`);
    this.name = 'CsrfValidationException';
  }
}

/**
 * Exception for invalid CSRF configuration
 */
export class CsrfConfigurationException extends Error {
  constructor(message: string) {
    super(`Invalid CSRF configuration: ${message}`);
    this.name = 'CsrfConfigurationException';
  }
}
