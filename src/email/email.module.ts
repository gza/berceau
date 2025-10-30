/**
 * Email Module
 *
 * NestJS module that provides email sending capabilities.
 * Exports EmailService for dependency injection.
 */

import { Module, OnModuleInit, Logger } from "@nestjs/common"
import { EmailService } from "./email.service"
import { loadEmailConfig } from "./config"

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  private readonly logger = new Logger(EmailModule.name)

  async onModuleInit() {
    const config = loadEmailConfig()

    // Validate required configuration
    if (!config.smtpHost) {
      throw new Error(
        "Email configuration error: SMTP_HOST is required. Please set the SMTP_HOST environment variable.",
      )
    }

    if (!config.smtpPort || config.smtpPort <= 0 || config.smtpPort > 65535) {
      throw new Error(
        `Email configuration error: Invalid SMTP_PORT (${config.smtpPort}). Must be between 1 and 65535.`,
      )
    }

    // Warn about missing credentials in production
    if (process.env.NODE_ENV === "production") {
      if (!config.smtpUser || !config.smtpPass) {
        this.logger.warn(
          "SMTP credentials (SMTP_USER/SMTP_PASS) not configured. Authentication may fail if required by the SMTP server.",
        )
      }

      if (!config.smtpTlsEnforced) {
        this.logger.warn(
          "TLS enforcement is disabled (SMTP_TLS_ENFORCED=false). Emails will be sent over unencrypted connections. This is NOT recommended for production.",
        )
      }
    }

    // Log successful initialization
    this.logger.log(
      `Email module initialized: SMTP ${config.smtpHost}:${config.smtpPort} (TLS: ${config.smtpTlsEnforced ? "enforced" : "optional"})`,
    )

    // Test SMTP connection (optional, only in development)
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SMTP_TEST_CONNECTION === "true"
    ) {
      try {
        const emailService = new EmailService()
        await this.testConnection(emailService)
        this.logger.log("SMTP connection test: SUCCESS")
      } catch (error) {
        this.logger.error(
          `SMTP connection test: FAILED - ${error instanceof Error ? error.message : "Unknown error"}`,
        )
        this.logger.warn(
          "Email module will continue, but emails may fail to send. Check your SMTP configuration.",
        )
      }
    }
  }

  private async testConnection(emailService: EmailService): Promise<void> {
    // Access the transport through reflection to test the connection
    // We need to access the private transport property for connection testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const transport = (emailService as any).transport as {
      verify?: () => Promise<void>
    }
    if (transport && typeof transport.verify === "function") {
      await transport.verify()
    }
  }
}
