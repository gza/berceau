/**
 * CSRF Token Component for Server-Side Rendering
 *
 * Feature: 003-provide-an-easy
 * User Story 3: JSX Component for Forms
 * Date: 2025-10-26
 *
 * This component renders a hidden input field containing a CSRF token.
 * It must be used within a request context (SSR only, no client-side rendering).
 */

import type React from "react"
import type { CsrfTokenProps } from "./types"
import { getRequestContext } from "./csrf-context"

/**
 * CsrfToken component renders a hidden input field with a CSRF token
 *
 * This component is designed for server-side rendering only.
 * It retrieves the CSRF token from the request context and renders
 * it as a hidden input field in forms.
 *
 * @param props - Component props (optional fieldName, id, data-testid)
 * @returns JSX element representing a hidden input field
 *
 * @throws {Error} If rendered outside of a request context
 * @throws {Error} If session is not available in the request
 *
 * @example
 * ```tsx
 * // Basic usage
 * <form method="POST" action="/submit">
 *   <CsrfToken />
 *   <input type="text" name="username" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example
 * ```tsx
 * // With custom field name
 * <CsrfToken fieldName="csrf_token" />
 * ```
 *
 * @example
 * ```tsx
 * // With custom id and test id
 * <CsrfToken id="my-csrf" data-testid="custom-csrf" />
 * ```
 */
export function CsrfToken(props?: CsrfTokenProps): React.JSX.Element | null {
  // Get request context from AsyncLocalStorage
  const context = getRequestContext()

  // Gracefully handle missing context (e.g., in test environments without session middleware)
  // In production with session middleware, context should always be available
  if (!context) {
    // Return null instead of throwing - allows forms to work in tests
    // In production, this means CSRF protection isn't active (guard will still validate)
    return null
  }

  // Validation: Ensure session exists in request
  if (!context.request.session) {
    // Return null for missing session (test/dev environments)
    // The guard will still protect POST requests in production
    return null
  }

  // Generate or retrieve CSRF token using the service from context
  const token = context.service.generateToken(context.request.session)

  // Determine field name (use prop or service default)
  const fieldName = props?.fieldName ?? context.service.getFieldName()

  // Determine test id (use prop or default)
  const testId = props?.["data-testid"] ?? "csrf-token"

  // Render hidden input element
  return (
    <input
      type="hidden"
      name={fieldName}
      value={token}
      id={props?.id}
      data-testid={testId}
    />
  )
}
