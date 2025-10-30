/**
 * Email error builder utilities
 *
 * Provides a standardized email error class with proper typing
 * and context information.
 */

import type { SendEmailErrorType } from "./types"

/**
 * Email error class
 */
export class EmailError extends Error {
  public readonly type: SendEmailErrorType
  public readonly code?: string | number
  public readonly context?: Record<string, unknown>

  constructor(
    type: SendEmailErrorType,
    message: string,
    code?: string | number,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "EmailError"
    this.type = type
    this.code = code
    this.context = context

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailError)
    }
  }
}
