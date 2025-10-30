/**
 * SMTP sender adapter
 *
 * Handles sending emails via Nodemailer SMTP transport and maps
 * SMTP errors to EmailError types for consistent error handling.
 */

import type { Transporter } from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import { EmailError } from "./errors"

/**
 * Email send options for the SMTP sender
 */
export interface SmtpSendOptions {
  from: string
  to: string[]
  subject: string
  html: string
}

/**
 * Result of an SMTP send operation
 */
export interface SmtpSendResult {
  messageId: string
  accepted: string[]
  rejected: string[]
}

/**
 * Sends an email via SMTP transport
 *
 * @param transport - Configured Nodemailer transport
 * @param options - Email send options (from, to, subject, html)
 * @returns Promise resolving to send result with message ID
 * @throws EmailError with appropriate type if send fails
 */
export async function sendViaSmtp(
  transport: Transporter<SMTPTransport.SentMessageInfo>,
  options: SmtpSendOptions,
): Promise<SmtpSendResult> {
  const { from, to, subject, html } = options

  try {
    const result = await transport.sendMail({
      from,
      to,
      subject,
      html,
    })

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
      rejected: result.rejected as string[],
    }
  } catch (error) {
    // Map SMTP errors to EmailError types
    throw mapSmtpError(error)
  }
}

/**
 * Maps SMTP/Nodemailer errors to EmailError types
 *
 * @param error - Error from SMTP operation
 * @returns EmailError with appropriate type and context
 */
function mapSmtpError(error: unknown): EmailError {
  if (!(error instanceof Error)) {
    // For non-Error objects, attempt to extract useful information
    let errorStr: string
    if (typeof error === "object" && error !== null) {
      try {
        errorStr = JSON.stringify(error)
      } catch {
        errorStr = "[UnserializableError]"
      }
    } else if (typeof error === "string") {
      errorStr = error
    } else if (typeof error === "number") {
      errorStr = error.toString()
    } else {
      errorStr = "[UnknownErrorType]"
    }

    return new EmailError("send", "Unknown SMTP error occurred", undefined, {
      originalError: errorStr,
    })
  }

  const errorMessage = error.message.toLowerCase()
  const errorName = error.name

  // Authentication errors
  if (
    errorMessage.includes("auth") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("login") ||
    errorMessage.includes("username") ||
    errorMessage.includes("password") ||
    errorMessage.includes("535") // SMTP auth failed code
  ) {
    return new EmailError("auth", error.message, extractSmtpCode(error), {
      provider: "smtp",
    })
  }

  // Timeout errors
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out") ||
    errorName === "TimeoutError"
  ) {
    return new EmailError("timeout", error.message, 408, {
      provider: "smtp",
      errorName,
    })
  }

  // Connection/unavailable errors
  if (
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("ehostunreach") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("unavailable")
  ) {
    return new EmailError("unavailable", error.message, 503, {
      provider: "smtp",
      errorName,
    })
  }

  // Rate limit errors
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many") ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota")
  ) {
    return new EmailError(
      "rate_limit",
      error.message,
      extractSmtpCode(error) || 429,
      {
        provider: "smtp",
      },
    )
  }

  // Default to generic send error
  return new EmailError("send", error.message, extractSmtpCode(error), {
    provider: "smtp",
    errorName,
  })
}

/**
 * Extracts SMTP error code from error object if available
 *
 * @param error - Error object
 * @returns SMTP code or undefined
 */
function extractSmtpCode(error: Error): string | number | undefined {
  // Nodemailer errors may have responseCode or code properties
  const errorWithCode = error as Error & {
    responseCode?: number
    code?: string | number
  }

  if (errorWithCode.responseCode !== undefined) {
    return errorWithCode.responseCode
  }

  if (errorWithCode.code !== undefined) {
    return errorWithCode.code
  }

  // Try to extract code from message (e.g., "535 Authentication failed")
  const match = error.message.match(/^(\d{3})\s/)
  if (match) {
    return parseInt(match[1], 10)
  }

  return undefined
}
