/**
 * Email configuration schema
 * Environment variables for SMTP connectivity
 */

/**
 * SMTP server configuration from environment variables
 */
export interface EmailConfig {
  /** SMTP server hostname (e.g., 'mailpit' in dev, 'smtp.provider.com' in prod) */
  smtpHost: string
  /** SMTP server port (e.g., 1025 for Mailpit, 587 for TLS, 465 for SSL) */
  smtpPort: number
  /** SMTP authentication username (optional for local Mailpit) */
  smtpUser: string
  /** SMTP authentication password (optional for local Mailpit) */
  smtpPass: string
  /** Enforce TLS encryption (fail if TLS unavailable when true) */
  smtpTlsEnforced: boolean
  /** Default 'from' address if not specified in send call */
  smtpFromDefault: string
  /** Connection timeout in milliseconds (default: 5000ms) */
  timeoutConnectMs: number
  /** Send operation timeout in milliseconds (default: 10000ms) */
  timeoutSendMs: number
}

/**
 * Load and validate email configuration from environment variables
 * @returns Validated email configuration object
 * @throws Error if required environment variables are missing or invalid
 */
export function loadEmailConfig(): EmailConfig {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER ?? ""
  const smtpPass = process.env.SMTP_PASS ?? ""
  const smtpTlsEnforced = process.env.SMTP_TLS_ENFORCED === "true"
  const smtpFromDefault = process.env.SMTP_FROM_DEFAULT
  const timeoutConnectMs = parseInt(
    process.env.TIMEOUT_CONNECT_MS ?? "5000",
    10,
  )
  const timeoutSendMs = parseInt(process.env.TIMEOUT_SEND_MS ?? "10000", 10)

  // Validate required configuration
  if (!smtpHost) {
    throw new Error("SMTP_HOST environment variable is required")
  }
  if (!smtpPort) {
    throw new Error("SMTP_PORT environment variable is required")
  }
  if (!smtpFromDefault) {
    throw new Error("SMTP_FROM_DEFAULT environment variable is required")
  }

  const port = parseInt(smtpPort, 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `SMTP_PORT must be a valid port number (1-65535), got: ${smtpPort}`,
    )
  }

  if (isNaN(timeoutConnectMs) || timeoutConnectMs < 0) {
    throw new Error(
      `TIMEOUT_CONNECT_MS must be a non-negative number, got: ${process.env.TIMEOUT_CONNECT_MS}`,
    )
  }

  if (isNaN(timeoutSendMs) || timeoutSendMs < 0) {
    throw new Error(
      `TIMEOUT_SEND_MS must be a non-negative number, got: ${process.env.TIMEOUT_SEND_MS}`,
    )
  }

  return {
    smtpHost,
    smtpPort: port,
    smtpUser,
    smtpPass,
    smtpTlsEnforced,
    smtpFromDefault,
    timeoutConnectMs,
    timeoutSendMs,
  }
}
