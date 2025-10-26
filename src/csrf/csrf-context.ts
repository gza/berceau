/**
 * CSRF Request Context using AsyncLocalStorage
 *
 * Feature: 003-provide-an-easy
 * Date: 2025-10-26
 *
 * Provides request-scoped context for CSRF token generation during SSR.
 * Uses Node.js AsyncLocalStorage to make request and service available to
 * components without prop drilling.
 */

import { AsyncLocalStorage } from "node:async_hooks"
import type { CsrfService } from "./csrf.service"

/**
 * Context data stored for each request
 */
export interface CsrfRequestContext {
  /** Express request object with session */
  request: {
    session?: Record<string, unknown>
  }

  /** CSRF service instance */
  service: CsrfService
}

/**
 * AsyncLocalStorage instance for request-scoped context
 * This is a Node.js feature that maintains context across async operations
 * @see https://nodejs.org/api/async_hooks.html#class-asynclocalstorage
 */
const csrfAsyncLocalStorage = new AsyncLocalStorage<CsrfRequestContext>()

/**
 * Get the CSRF context for the current request
 *
 * @returns The request context, or null if not in a request context
 *
 * @example
 * ```typescript
 * const context = getRequestContext();
 * if (context) {
 *   const token = context.service.generateToken(context.request.session);
 * }
 * ```
 */
export function getRequestContext(): CsrfRequestContext | null {
  const context = csrfAsyncLocalStorage.getStore()
  return context ?? null
}

/**
 * Run a function within a CSRF request context
 *
 * @param context - The context to set for the request
 * @param callback - The function to run within the context
 * @returns The result of the callback
 *
 * @example
 * ```typescript
 * const html = runInContext(
 *   { request: req, service: csrfService },
 *   () => renderToString(<App />)
 * );
 * ```
 */
export function runInContext<T>(
  context: CsrfRequestContext,
  callback: () => T,
): T {
  return csrfAsyncLocalStorage.run(context, callback)
}

/**
 * Check if we're currently running within a request context
 *
 * @returns True if in a request context, false otherwise
 *
 * @example
 * ```typescript
 * if (hasRequestContext()) {
 *   // Safe to use getRequestContext()
 * }
 * ```
 */
export function hasRequestContext(): boolean {
  return csrfAsyncLocalStorage.getStore() !== undefined
}
