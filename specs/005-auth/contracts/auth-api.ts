/**
 * Authentication API Contracts
 * 
 * TypeScript interfaces and types defining the authentication API contracts.
 * These contracts are used by both the server implementation and tests.
 * 
 * Feature: 005-auth
 * Date: 2025-10-31
 */

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Request magic link for authentication
 * POST /auth/request-magic-link
 */
export interface RequestMagicLinkDto {
  /**
   * User's email or username
   * @example "john@example.com" or "john"
   */
  identifier: string;
  
  /**
   * CSRF token (required for POST requests)
   * Validated by CsrfGuard
   */
  _csrf: string;
}

/**
 * Logout from current session
 * POST /auth/logout
 */
export interface LogoutDto {
  /**
   * CSRF token (required for POST requests)
   * Validated by CsrfGuard
   */
  _csrf: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Response for magic link request
 * Timing-safe: same response for existing and non-existing users
 */
export interface RequestMagicLinkResponseDto {
  /**
   * Generic success message
   * Never reveals if user exists or not
   */
  message: string;
  
  /**
   * HTTP status code
   */
  statusCode: 200;
}

/**
 * Response for successful magic link verification
 * Includes session information
 */
export interface VerifyMagicLinkSuccessDto {
  /**
   * Success indicator
   */
  success: true;
  
  /**
   * Authenticated user information
   */
  user: {
    id: string;
    username: string;
    email: string;
  };
  
  /**
   * HTTP status code
   */
  statusCode: 200;
}

/**
 * Response for failed magic link verification
 */
export interface VerifyMagicLinkErrorDto {
  /**
   * Error indicator
   */
  success: false;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code for client handling
   */
  errorCode: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_USED';
  
  /**
   * HTTP status code
   */
  statusCode: 400 | 401;
}

export type VerifyMagicLinkResponseDto = 
  | VerifyMagicLinkSuccessDto 
  | VerifyMagicLinkErrorDto;

/**
 * Response for logout
 */
export interface LogoutResponseDto {
  /**
   * Success message
   */
  message: string;
  
  /**
   * HTTP status code
   */
  statusCode: 200;
}

/**
 * Response for session check
 * GET /auth/session
 */
export interface SessionResponseDto {
  /**
   * Whether user is authenticated
   */
  authenticated: boolean;
  
  /**
   * User information (if authenticated)
   */
  user?: {
    id: string;
    username: string;
    email: string;
  };
  
  /**
   * Session expiration (if authenticated)
   */
  expiresAt?: string; // ISO 8601 format
  
  /**
   * HTTP status code
   */
  statusCode: 200;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Rate limit exceeded error
 * HTTP 429 Too Many Requests
 */
export interface RateLimitErrorDto {
  message: string;
  statusCode: 429;
  retryAfter: number; // Seconds until retry allowed
}

/**
 * Validation error
 * HTTP 400 Bad Request
 */
export interface ValidationErrorDto {
  message: string;
  statusCode: 400;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * CSRF token error
 * HTTP 403 Forbidden
 */
export interface CsrfErrorDto {
  message: string;
  statusCode: 403;
}

/**
 * Generic server error
 * HTTP 500 Internal Server Error
 */
export interface ServerErrorDto {
  message: string;
  statusCode: 500;
}

// ============================================================================
// API Endpoint Specifications
// ============================================================================

/**
 * Authentication API endpoints specification
 */
export interface AuthEndpoints {
  /**
   * Request magic link
   * 
   * @method POST
   * @path /auth/request-magic-link
   * @auth Not required (public endpoint)
   * @csrf Required
   * @rateLimit 5 requests per hour per identifier
   * 
   * @body RequestMagicLinkDto
   * @returns RequestMagicLinkResponseDto (200)
   * @throws ValidationErrorDto (400)
   * @throws CsrfErrorDto (403)
   * @throws RateLimitErrorDto (429)
   * @throws ServerErrorDto (500)
   */
  requestMagicLink: {
    method: 'POST';
    path: '/auth/request-magic-link';
    body: RequestMagicLinkDto;
    response: RequestMagicLinkResponseDto;
  };

  /**
   * Verify magic link token
   * 
   * @method GET
   * @path /auth/verify/:token
   * @auth Not required (token in URL)
   * @csrf Not required (GET request)
   * @rateLimit None (token provides rate limiting)
   * 
   * @params { token: string }
   * @returns VerifyMagicLinkResponseDto (200, 400, 401)
   * @throws ServerErrorDto (500)
   * 
   * On success: Creates session, redirects to dashboard
   * On error: Redirects to error page with message
   */
  verifyMagicLink: {
    method: 'GET';
    path: '/auth/verify/:token';
    params: { token: string };
    response: VerifyMagicLinkResponseDto;
  };

  /**
   * Logout (terminate session)
   * 
   * @method POST
   * @path /auth/logout
   * @auth Required (must have active session)
   * @csrf Required
   * @rateLimit None
   * 
   * @body LogoutDto
   * @returns LogoutResponseDto (200)
   * @throws CsrfErrorDto (403)
   * @throws ServerErrorDto (500)
   * 
   * On success: Destroys session, redirects to login
   */
  logout: {
    method: 'POST';
    path: '/auth/logout';
    body: LogoutDto;
    response: LogoutResponseDto;
  };

  /**
   * Check session status
   * 
   * @method GET
   * @path /auth/session
   * @auth Not required (returns auth status)
   * @csrf Not required (GET request)
   * @rateLimit None
   * 
   * @returns SessionResponseDto (200)
   * @throws ServerErrorDto (500)
   */
  getSession: {
    method: 'GET';
    path: '/auth/session';
    response: SessionResponseDto;
  };
}

// ============================================================================
// UI Page Contracts (SSR Routes)
// ============================================================================

/**
 * Login page
 * 
 * @method GET
 * @path /login
 * @auth Not required (redirects if already authenticated)
 * @returns HTML (LoginPage component)
 */
export interface LoginPageRoute {
  method: 'GET';
  path: '/login';
  response: 'text/html';
}

/**
 * Magic link sent confirmation page
 * 
 * @method GET
 * @path /auth/magic-link-sent
 * @auth Not required
 * @returns HTML (MagicLinkSentPage component)
 */
export interface MagicLinkSentPageRoute {
  method: 'GET';
  path: '/auth/magic-link-sent';
  response: 'text/html';
}

/**
 * Magic link error page
 * 
 * @method GET
 * @path /auth/error
 * @query { reason: string }
 * @auth Not required
 * @returns HTML (MagicLinkErrorPage component)
 */
export interface MagicLinkErrorPageRoute {
  method: 'GET';
  path: '/auth/error';
  query: { reason: string };
  response: 'text/html';
}

// ============================================================================
// Guard Decorators
// ============================================================================

/**
 * Marks a route as requiring authentication
 * Applied automatically via global AuthGuard
 * Use @Public() to exempt routes
 */
export type AuthenticatedRoute = {
  guards: ['AuthGuard'];
};

/**
 * Marks a route as public (no authentication required)
 * Decorator: @Public()
 */
export type PublicRoute = {
  metadata: { isPublic: true };
};

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Authentication service interface
 */
export interface IAuthService {
  /**
   * Request magic link for user
   * @throws NotFoundException if user not found (internal only, never exposed)
   * @throws Error if email send fails
   */
  requestMagicLink(identifier: string): Promise<void>;

  /**
   * Verify magic link token
   * @returns User if valid, null if invalid/expired/used
   */
  verifyMagicLink(token: string): Promise<{
    id: string;
    username: string;
    email: string;
  } | null>;

  /**
   * Check if rate limit exceeded for identifier
   * @returns true if allowed, false if rate limit exceeded
   */
  checkRateLimit(identifier: string): boolean;
}

/**
 * Session service interface
 */
export interface ISessionService {
  /**
   * Create new session for user
   * @returns Session ID
   */
  createSession(userId: string): Promise<string>;

  /**
   * Get session by ID
   * @returns Session data or null if not found/expired
   */
  getSession(sessionId: string): Promise<{
    userId: string;
    expiresAt: Date;
  } | null>;

  /**
   * Update session activity (touch)
   */
  touchSession(sessionId: string): Promise<void>;

  /**
   * Destroy session
   */
  destroySession(sessionId: string): Promise<void>;

  /**
   * Cleanup expired sessions
   * @returns Number of sessions deleted
   */
  cleanupExpiredSessions(): Promise<number>;
}

/**
 * User service interface
 */
export interface IUserService {
  /**
   * Find user by email or username
   */
  findByIdentifier(identifier: string): Promise<{
    id: string;
    username: string;
    email: string;
  } | null>;

  /**
   * Find user by ID
   */
  findById(userId: string): Promise<{
    id: string;
    username: string;
    email: string;
  } | null>;

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

export const AUTH_CONSTANTS = {
  /**
   * Magic link token expiration time (15 minutes)
   */
  MAGIC_LINK_EXPIRY_MS: 15 * 60 * 1000,

  /**
   * Session inactivity timeout (24 hours)
   */
  SESSION_INACTIVITY_MS: 24 * 60 * 60 * 1000,

  /**
   * Session absolute maximum lifetime (7 days)
   */
  SESSION_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,

  /**
   * Rate limit: max requests per window
   */
  RATE_LIMIT_MAX_REQUESTS: 5,

  /**
   * Rate limit: time window (1 hour)
   */
  RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000,

  /**
   * Environment variables for optional user seeding (OnModuleInit hook)
   */
  ENV_VARS: {
    SEED_USER_USERNAME: 'SEED_USER_USERNAME',
    SEED_USER_EMAIL: 'SEED_USER_EMAIL',
  },
} as const;
