/**
 * Email logger utilities with PII redaction
 *
 * Provides logging utilities that automatically redact personally identifiable
 * information (PII) such as email addresses, and ensure that subjects and bodies
 * are never logged.
 */

import { Logger } from "@nestjs/common"

/**
 * Redacts an email address to prevent PII exposure
 * Format: u***@d***
 *
 * @param email - The email address to redact
 * @returns Redacted email address
 */
export function redactEmailAddress(email: string): string {
  if (!email || typeof email !== "string") {
    return "[INVALID_EMAIL]"
  }

  const atIndex = email.indexOf("@")
  if (atIndex === -1) {
    return "u***@[INVALID_DOMAIN]"
  }

  const localPart = email.substring(0, atIndex)
  const domain = email.substring(atIndex + 1)

  // Show first character of local part
  const localRedacted = localPart.length > 0 ? `${localPart[0]}***` : "***"

  // Show first character of domain
  const domainRedacted = domain.length > 0 ? `${domain[0]}***` : "***"

  return `${localRedacted}@${domainRedacted}`
}

/**
 * Redacts multiple email addresses
 *
 * @param emails - Array of email addresses to redact
 * @returns Array of redacted email addresses
 */
export function redactEmailAddresses(emails: string[]): string[] {
  if (!Array.isArray(emails)) {
    return ["[INVALID_EMAIL_ARRAY]"]
  }

  return emails.map(redactEmailAddress)
}

/**
 * Email logger class that wraps NestJS Logger with PII redaction
 */
export class EmailLogger {
  private readonly logger: Logger

  constructor(context: string = "EmailService") {
    this.logger = new Logger(context)
  }

  /**
   * Logs email send attempt with redacted metadata
   *
   * @param metadata - Metadata about the email (no PII, no subject, no body)
   */
  logSendAttempt(metadata: {
    from: string
    to: string[]
    provider: string
    templateId?: string
    templateType?: string
  }): void {
    this.logger.log({
      action: "send_attempt",
      from: redactEmailAddress(metadata.from),
      to: redactEmailAddresses(metadata.to),
      provider: metadata.provider,
      templateId: metadata.templateId,
      templateType: metadata.templateType,
    })
  }

  /**
   * Logs successful email send with redacted metadata
   *
   * @param metadata - Metadata about the email (no PII, no subject, no body)
   */
  logSendSuccess(metadata: {
    from: string
    to: string[]
    provider: string
    messageId: string
    durationMs?: number
    renderMs?: number
    sendMs?: number
    templateId?: string
    templateType?: string
  }): void {
    this.logger.log({
      action: "send_success",
      from: redactEmailAddress(metadata.from),
      to: redactEmailAddresses(metadata.to),
      provider: metadata.provider,
      messageId: metadata.messageId,
      durationMs: metadata.durationMs,
      renderMs: metadata.renderMs,
      sendMs: metadata.sendMs,
      templateId: metadata.templateId,
      templateType: metadata.templateType,
    })
  }

  /**
   * Logs failed email send with redacted metadata
   *
   * @param metadata - Metadata about the email (no PII, no subject, no body)
   */
  logSendFailure(metadata: {
    from: string
    to: string[]
    provider: string
    errorType: string
    errorMessage: string
    errorCode?: string | number
    durationMs?: number
    templateId?: string
    templateType?: string
  }): void {
    this.logger.error({
      action: "send_failure",
      from: redactEmailAddress(metadata.from),
      to: redactEmailAddresses(metadata.to),
      provider: metadata.provider,
      errorType: metadata.errorType,
      errorMessage: metadata.errorMessage,
      errorCode: metadata.errorCode,
      durationMs: metadata.durationMs,
      templateId: metadata.templateId,
      templateType: metadata.templateType,
    })
  }

  /**
   * Logs email validation failure
   *
   * @param errorMessage - Validation error message (no PII)
   */
  logValidationFailure(errorMessage: string): void {
    this.logger.warn({
      action: "validation_failure",
      errorMessage,
    })
  }

  /**
   * Logs email rendering information
   *
   * @param metadata - Rendering metadata (no PII, no subject, no body)
   */
  logRender(metadata: {
    templateId?: string
    templateType?: string
    htmlSizeBytes?: number
    durationMs?: number
  }): void {
    this.logger.debug({
      action: "render",
      templateId: metadata.templateId,
      templateType: metadata.templateType,
      htmlSizeBytes: metadata.htmlSizeBytes,
      durationMs: metadata.durationMs,
    })
  }

  /**
   * Logs email transport configuration (on startup)
   *
   * @param config - Transport configuration (no secrets)
   */
  logTransportConfig(config: {
    host: string
    port: number
    tlsEnforced: boolean
    fromDefault: string
  }): void {
    this.logger.log({
      action: "transport_configured",
      host: config.host,
      port: config.port,
      tlsEnforced: config.tlsEnforced,
      fromDefault: redactEmailAddress(config.fromDefault),
    })
  }

  /**
   * Logs TLS usage warning
   */
  logTlsNotUsed(): void {
    this.logger.warn({
      action: "tls_not_used",
      message: "TLS is not enforced - emails sent without encryption",
    })
  }

  /**
   * Logs performance warning for slow operations
   *
   * @param message - Performance warning message
   */
  logPerformanceWarning(message: string): void {
    this.logger.warn({
      action: "performance_warning",
      message,
    })
  }
}
