import type { ReactElement } from "react"

/**
 * RFC 5322-compliant email address (validated at runtime)
 */
export type EmailAddress = string

/**
 * Error types that can occur during email operations
 */
export type SendEmailErrorType =
  | "validation" // Input validation failed (invalid email, subject, etc.)
  | "render" // JSX to HTML rendering failed
  | "send" // SMTP send operation failed
  | "auth" // SMTP authentication failed
  | "rate_limit" // Provider rate limit exceeded
  | "timeout" // Connection or send timeout
  | "unavailable" // SMTP service unavailable

/**
 * Input parameters for sending an email
 */
export interface SendEmailInput {
  /** Sender email address (RFC 5322 compliant) */
  from: EmailAddress
  /** Recipient email addresses (1 to N recipients) */
  to: EmailAddress[]
  /** Email subject (max 200 characters, non-empty) */
  subject: string
  /** JSX body to render server-side to HTML */
  body: ReactElement
}

/**
 * Success result from sending an email
 */
export interface SendEmailSuccess {
  ok: true
  /** Provider-assigned message ID */
  messageId: string
  /** Email provider used (always 'smtp' in v1) */
  provider: "smtp"
}

/**
 * Failure result from sending an email
 */
export interface SendEmailFailure {
  ok: false
  error: {
    /** Error type categorization */
    type: SendEmailErrorType
    /** Human-readable error message */
    message: string
    /** Provider-specific error code (if available) */
    code?: string | number
    /** Additional context (no PII) */
    context?: Record<string, unknown>
  }
}

/**
 * Result type returned from email send operations
 */
export type SendEmailResult = SendEmailSuccess | SendEmailFailure

/**
 * Email service interface for sending emails
 */
export interface EmailService {
  /**
   * Send an email with JSX body rendered to HTML
   * @param input Email parameters (from, to, subject, body)
   * @returns Promise resolving to success or failure result
   */
  send(input: SendEmailInput): Promise<SendEmailResult>
}
