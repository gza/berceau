/**
 * SMTP transport factory
 *
 * Creates and configures Nodemailer SMTP transporter with TLS enforcement,
 * authentication, and timeouts based on email configuration.
 */

import * as nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import type { EmailConfig } from "./config"
import { EmailLogger } from "./logger"

/**
 * Creates an SMTP transport with the given configuration
 *
 * @param config - Email configuration from environment
 * @param logger - Email logger instance for logging transport events
 * @returns Configured Nodemailer transporter
 */
export function createSmtpTransport(
  config: EmailConfig,
  logger?: EmailLogger,
): Transporter<SMTPTransport.SentMessageInfo> {
  const {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpTlsEnforced,
    timeoutConnectMs,
    timeoutSendMs,
  } = config

  // Determine TLS/STARTTLS settings
  let secure = false
  let requireTLS = false

  // Port 465 typically means direct TLS/SSL
  if (smtpPort === 465) {
    secure = true
  }

  // If TLS is enforced, require STARTTLS for non-465 ports
  if (smtpTlsEnforced && smtpPort !== 465) {
    requireTLS = true
  }

  // Log TLS configuration warning if not enforced
  if (!smtpTlsEnforced && logger) {
    logger.logTlsNotUsed()
  }

  // Build authentication if credentials provided
  const auth =
    smtpUser && smtpPass
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined

  // Create SMTP transport options
  const transportOptions: SMTPTransport.Options = {
    host: smtpHost,
    port: smtpPort,
    secure, // true for port 465, false for other ports
    requireTLS, // force STARTTLS if TLS is enforced
    auth,
    connectionTimeout: timeoutConnectMs,
    greetingTimeout: timeoutConnectMs,
    socketTimeout: timeoutSendMs,
    // Disable DNS lookup for local development (Mailpit)
    // In production, this should use proper DNS
    tls: {
      rejectUnauthorized: smtpTlsEnforced, // Strict cert validation when TLS enforced
    },
  }

  // Create the transport
  const transport = nodemailer.createTransport(transportOptions)

  // Log transport configuration
  if (logger) {
    logger.logTransportConfig({
      host: smtpHost,
      port: smtpPort,
      tlsEnforced: smtpTlsEnforced,
      fromDefault: config.smtpFromDefault,
    })
  }

  return transport
}

/**
 * Verifies SMTP transport connectivity
 *
 * @param transport - Nodemailer transport to verify
 * @returns Promise that resolves to true if connection is successful
 * @throws Error if connection fails
 */
export async function verifySmtpTransport(
  transport: Transporter<SMTPTransport.SentMessageInfo>,
): Promise<boolean> {
  try {
    await transport.verify()
    return true
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error)
    throw new Error(`SMTP transport verification failed: ${errorMessage}`)
  }
}
