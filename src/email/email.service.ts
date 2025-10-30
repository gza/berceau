/**
 * Email Service
 *
 * Core service for sending transactional emails with JSX body rendering.
 * Handles validation, rendering, SMTP sending, error handling, and logging.
 */

import { Injectable } from "@nestjs/common"
import type { Transporter } from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import type {
  EmailService as IEmailService,
  SendEmailInput,
  SendEmailResult,
  SendEmailSuccess,
  SendEmailFailure,
} from "./types"
import {
  validateEmailAddresses,
  validateEmailAddress,
  validateSubject,
  validateHtmlSize,
} from "./validation"
import { renderEmailBody } from "./renderer"
import { EmailError } from "./errors"
import { sendViaSmtp } from "./smtp-sender"
import { EmailLogger } from "./logger"
import { createSmtpTransport } from "./transport"
import { loadEmailConfig } from "./config"

@Injectable()
export class EmailService implements IEmailService {
  private readonly transport: Transporter<SMTPTransport.SentMessageInfo>
  private readonly logger: EmailLogger

  constructor() {
    const config = loadEmailConfig()
    this.logger = new EmailLogger("EmailService")
    this.transport = createSmtpTransport(config, this.logger)
  }

  /**
   * Send an email with JSX body rendered to HTML
   *
   * @param input - Email parameters (from, to, subject, body)
   * @returns Promise resolving to success or failure result
   */
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const startTime = Date.now()
    let renderStartTime = 0
    let renderEndTime = 0
    let sendStartTime = 0
    let sendEndTime = 0

    try {
      // Log send attempt (with redacted addresses)
      this.logger.logSendAttempt({
        from: input.from,
        to: input.to,
        provider: "smtp",
      })

      // Step 1: Validate input
      const validationError = this.validateInput(input)
      if (validationError) {
        this.logger.logSendFailure({
          from: input.from,
          to: input.to,
          provider: "smtp",
          errorType: validationError.error.type,
          errorMessage: validationError.error.message,
          errorCode: validationError.error.code,
          durationMs: Date.now() - startTime,
        })
        return validationError
      }

      // Step 2: Render JSX body to HTML
      let html: string
      try {
        renderStartTime = Date.now()
        html = renderEmailBody(input.body)
        renderEndTime = Date.now()

        const renderTimeMs = renderEndTime - renderStartTime

        // Performance monitoring: Warn if render time exceeds threshold
        if (renderTimeMs > 200) {
          this.logger.logPerformanceWarning(
            `Slow email rendering: ${renderTimeMs}ms (threshold: 200ms)`,
          )
        }
      } catch (error) {
        const renderError = new EmailError(
          "render",
          error instanceof Error ? error.message : "Failed to render JSX",
          undefined,
          {
            component: input.body.type?.toString() || "unknown",
          },
        )

        const failure: SendEmailFailure = {
          ok: false,
          error: {
            type: renderError.type,
            message: renderError.message,
            code: renderError.code,
            context: renderError.context,
          },
        }

        this.logger.logSendFailure({
          from: input.from,
          to: input.to,
          provider: "smtp",
          errorType: failure.error.type,
          errorMessage: failure.error.message,
          errorCode: failure.error.code,
          durationMs: Date.now() - startTime,
        })

        return failure
      }

      // Step 3: Validate HTML size
      const htmlSizeResult = validateHtmlSize(html)
      if (!htmlSizeResult.valid) {
        const sizeError = new EmailError(
          "validation",
          htmlSizeResult.error || "HTML size validation failed",
          undefined,
          { htmlSizeBytes: Buffer.byteLength(html, "utf8") },
        )

        const failure: SendEmailFailure = {
          ok: false,
          error: {
            type: sizeError.type,
            message: sizeError.message,
            code: sizeError.code,
            context: sizeError.context,
          },
        }

        this.logger.logSendFailure({
          from: input.from,
          to: input.to,
          provider: "smtp",
          errorType: failure.error.type,
          errorMessage: failure.error.message,
          errorCode: failure.error.code,
          durationMs: Date.now() - startTime,
        })

        return failure
      }

      // Step 4: Send via SMTP
      try {
        sendStartTime = Date.now()
        const result = await sendViaSmtp(this.transport, {
          from: input.from,
          to: input.to,
          subject: input.subject,
          html,
        })
        sendEndTime = Date.now()

        const sendTimeMs = sendEndTime - sendStartTime
        const totalTimeMs = Date.now() - startTime
        const renderTimeMs = renderEndTime - renderStartTime

        // Performance monitoring: Warn if send time exceeds threshold
        if (sendTimeMs > 30000) {
          this.logger.logPerformanceWarning(
            `Slow email send: ${sendTimeMs}ms (threshold: 30000ms)`,
          )
        }

        // Performance monitoring: Warn if total time exceeds threshold
        if (totalTimeMs > 30000) {
          this.logger.logPerformanceWarning(
            `Slow email operation: ${totalTimeMs}ms total (render: ${renderTimeMs}ms, send: ${sendTimeMs}ms)`,
          )
        }

        const success: SendEmailSuccess = {
          ok: true,
          messageId: result.messageId,
          provider: "smtp",
        }

        this.logger.logSendSuccess({
          from: input.from,
          to: input.to,
          provider: "smtp",
          messageId: result.messageId,
          durationMs: totalTimeMs,
          renderMs: renderTimeMs,
          sendMs: sendTimeMs,
        })

        return success
      } catch (error) {
        // sendViaSmtp already throws EmailError with proper typing
        if (error instanceof EmailError) {
          const failure: SendEmailFailure = {
            ok: false,
            error: {
              type: error.type,
              message: error.message,
              code: error.code,
              context: error.context,
            },
          }

          this.logger.logSendFailure({
            from: input.from,
            to: input.to,
            provider: "smtp",
            errorType: failure.error.type,
            errorMessage: failure.error.message,
            errorCode: failure.error.code,
            durationMs: Date.now() - startTime,
          })

          return failure
        }

        // Unexpected error type (shouldn't happen)
        const unknownError = new EmailError(
          "send",
          error instanceof Error ? error.message : "Unknown send error",
        )

        const failure: SendEmailFailure = {
          ok: false,
          error: {
            type: unknownError.type,
            message: unknownError.message,
          },
        }

        this.logger.logSendFailure({
          from: input.from,
          to: input.to,
          provider: "smtp",
          errorType: failure.error.type,
          errorMessage: failure.error.message,
          errorCode: failure.error.code,
          durationMs: Date.now() - startTime,
        })

        return failure
      }
    } catch (error) {
      // Catch-all for unexpected errors in validation/rendering
      const unexpectedError = new EmailError(
        "send",
        error instanceof Error ? error.message : "Unexpected error occurred",
      )

      const failure: SendEmailFailure = {
        ok: false,
        error: {
          type: unexpectedError.type,
          message: unexpectedError.message,
        },
      }

      this.logger.logSendFailure({
        from: input.from,
        to: input.to,
        provider: "smtp",
        errorType: failure.error.type,
        errorMessage: failure.error.message,
        errorCode: failure.error.code,
        durationMs: Date.now() - startTime,
      })

      return failure
    }
  }

  /**
   * Validates all input parameters
   *
   * @param input - Email input to validate
   * @returns SendEmailFailure if validation fails, null if valid
   */
  private validateInput(input: SendEmailInput): SendEmailFailure | null {
    // Validate FROM address
    const fromResult = validateEmailAddress(input.from)
    if (!fromResult.valid) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: `Invalid FROM address: ${fromResult.error}`,
          context: { field: "from" },
        },
      }
    }

    // Validate TO addresses
    const toResult = validateEmailAddresses(input.to)
    if (!toResult.valid) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: `Invalid TO address: ${toResult.error}`,
          context: { field: "to" },
        },
      }
    }

    // Validate subject
    const subjectResult = validateSubject(input.subject)
    if (!subjectResult.valid) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: `Invalid subject: ${subjectResult.error}`,
          context: { field: "subject" },
        },
      }
    }

    return null
  }
}
