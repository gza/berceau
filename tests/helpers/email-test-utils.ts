/**
 * Email Test Utilities
 *
 * Helper functions for testing email functionality with Mailpit.
 * Provides utilities to wait for emails, verify content, and manage test inbox.
 */

import {
  MailpitClient,
  MailpitMessageSummary,
  MailpitMessageDetail,
  createMailpitClient,
} from "../../src/email/testing/mailpit-client"

/**
 * Wait for an email matching a predicate to appear in Mailpit
 *
 * Polls Mailpit API until a message matching the predicate is found or timeout occurs.
 *
 * @param predicate - Function to test each message
 * @param options - Configuration options
 * @returns The first message matching the predicate
 * @throws Error if timeout occurs before email is found
 *
 * @example
 * ```typescript
 * const email = await waitForEmail(
 *   (msg) => msg.To[0].Address === 'user@example.com',
 *   { timeoutMs: 5000 }
 * );
 * ```
 */
export async function waitForEmail(
  predicate: (msg: MailpitMessageSummary) => boolean,
  options: {
    /** Timeout in milliseconds (default: 5000) */
    timeoutMs?: number
    /** Poll interval in milliseconds (default: 100) */
    pollIntervalMs?: number
    /** Mailpit client instance (default: creates new client) */
    client?: MailpitClient
  } = {},
): Promise<MailpitMessageSummary> {
  const timeoutMs = options.timeoutMs ?? 5000
  const pollIntervalMs = options.pollIntervalMs ?? 100
  const client = options.client ?? createMailpitClient()

  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const messages = await client.listMessages()
    const found = messages.find(predicate)

    if (found) {
      return found
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(
    `Email not received within ${timeoutMs}ms. Check Mailpit inbox for unexpected messages.`,
  )
}

/**
 * Wait for an email to a specific recipient
 *
 * Convenience wrapper around waitForEmail for the common case of waiting for
 * an email to a specific recipient address.
 *
 * @param recipient - Recipient email address
 * @param options - Configuration options
 * @returns The first email sent to the recipient
 *
 * @example
 * ```typescript
 * const email = await waitForEmailToRecipient('user@example.com');
 * ```
 */
export async function waitForEmailToRecipient(
  recipient: string,
  options: {
    timeoutMs?: number
    pollIntervalMs?: number
    client?: MailpitClient
  } = {},
): Promise<MailpitMessageSummary> {
  return waitForEmail(
    (msg) =>
      msg.To.some(
        (addr) => addr.Address.toLowerCase() === recipient.toLowerCase(),
      ),
    options,
  )
}

/**
 * Verify email content matches expected values
 *
 * Asserts that email content (subject, HTML body, text body, etc.) matches expectations.
 * Throws descriptive errors if validation fails.
 *
 * @param message - Message detail from Mailpit
 * @param expectations - Expected values to verify
 * @throws Error if any expectation is not met
 *
 * @example
 * ```typescript
 * verifyEmailContent(message, {
 *   subject: 'Welcome!',
 *   htmlIncludes: ['<h1>Welcome</h1>', 'Click here'],
 *   from: 'noreply@example.com',
 *   to: ['user@example.com']
 * });
 * ```
 */
export function verifyEmailContent(
  message: MailpitMessageDetail,
  expectations: {
    /** Expected subject (exact match) */
    subject?: string
    /** Expected sender address */
    from?: string
    /** Expected recipient addresses */
    to?: string[]
    /** Strings that must appear in HTML body */
    htmlIncludes?: string[]
    /** Strings that must appear in plain text body */
    textIncludes?: string[]
    /** Strings that must NOT appear in HTML body */
    htmlExcludes?: string[]
    /** Strings that must NOT appear in plain text body */
    textExcludes?: string[]
  },
): void {
  const errors: string[] = []

  // Verify subject
  if (expectations.subject !== undefined) {
    if (message.Subject !== expectations.subject) {
      errors.push(
        `Subject mismatch: expected "${expectations.subject}", got "${message.Subject}"`,
      )
    }
  }

  // Verify sender
  if (expectations.from !== undefined) {
    if (
      message.From.Address.toLowerCase() !== expectations.from.toLowerCase()
    ) {
      errors.push(
        `From mismatch: expected "${expectations.from}", got "${message.From.Address}"`,
      )
    }
  }

  // Verify recipients
  if (expectations.to !== undefined) {
    const actualTo = message.To.map((addr) => addr.Address.toLowerCase()).sort()
    const expectedTo = expectations.to.map((addr) => addr.toLowerCase()).sort()

    if (JSON.stringify(actualTo) !== JSON.stringify(expectedTo)) {
      errors.push(
        `To mismatch: expected ${JSON.stringify(expectedTo)}, got ${JSON.stringify(actualTo)}`,
      )
    }
  }

  // Verify HTML includes
  if (expectations.htmlIncludes) {
    for (const text of expectations.htmlIncludes) {
      if (!message.HTML.includes(text)) {
        errors.push(`HTML missing expected text: "${text}"`)
      }
    }
  }

  // Verify text includes
  if (expectations.textIncludes) {
    for (const text of expectations.textIncludes) {
      if (!message.Text.includes(text)) {
        errors.push(`Text missing expected text: "${text}"`)
      }
    }
  }

  // Verify HTML excludes
  if (expectations.htmlExcludes) {
    for (const text of expectations.htmlExcludes) {
      if (message.HTML.includes(text)) {
        errors.push(`HTML contains forbidden text: "${text}"`)
      }
    }
  }

  // Verify text excludes
  if (expectations.textExcludes) {
    for (const text of expectations.textExcludes) {
      if (message.Text.includes(text)) {
        errors.push(`Text contains forbidden text: "${text}"`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Email content verification failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    )
  }
}

/**
 * Clear Mailpit inbox
 *
 * Deletes all messages from Mailpit. Useful for test cleanup.
 *
 * @param client - Mailpit client instance (default: creates new client)
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await clearMailbox();
 * });
 * ```
 */
export async function clearMailbox(client?: MailpitClient): Promise<void> {
  const mailpitClient = client ?? createMailpitClient()
  await mailpitClient.clearInbox()
}

/**
 * Get message detail by ID
 *
 * Convenience wrapper around MailpitClient.getMessage.
 *
 * @param messageId - Mailpit message ID
 * @param client - Mailpit client instance (default: creates new client)
 * @returns Message detail with HTML/text content
 */
export async function getMessageDetail(
  messageId: string,
  client?: MailpitClient,
): Promise<MailpitMessageDetail> {
  const mailpitClient = client ?? createMailpitClient()
  return mailpitClient.getMessage(messageId)
}

/**
 * Assert that Mailpit is available
 *
 * Throws an error if Mailpit is not reachable. Useful for test setup.
 *
 * @param client - Mailpit client instance (default: creates new client)
 * @throws Error if Mailpit is not available
 *
 * @example
 * ```typescript
 * beforeAll(async () => {
 *   await assertMailpitAvailable();
 * });
 * ```
 */
export async function assertMailpitAvailable(
  client?: MailpitClient,
): Promise<void> {
  const mailpitClient = client ?? createMailpitClient()
  const isAvailable = await mailpitClient.isAvailable()

  if (!isAvailable) {
    throw new Error(
      "Mailpit is not available. Ensure Mailpit is running on http://localhost:8025.\n" +
        "Start with: docker compose up mailpit",
    )
  }
}

/**
 * Wait for multiple emails matching predicates
 *
 * Waits for multiple emails to be received. Useful when testing batch operations.
 *
 * @param predicates - Array of predicates to match
 * @param options - Configuration options
 * @returns Array of messages matching each predicate (in order)
 * @throws Error if timeout occurs before all emails are found
 *
 * @example
 * ```typescript
 * const [email1, email2] = await waitForEmails([
 *   (msg) => msg.To[0].Address === 'user1@example.com',
 *   (msg) => msg.To[0].Address === 'user2@example.com',
 * ]);
 * ```
 */
export async function waitForEmails(
  predicates: Array<(msg: MailpitMessageSummary) => boolean>,
  options: {
    timeoutMs?: number
    pollIntervalMs?: number
    client?: MailpitClient
  } = {},
): Promise<MailpitMessageSummary[]> {
  const results: MailpitMessageSummary[] = []

  for (const predicate of predicates) {
    const message = await waitForEmail(predicate, options)
    results.push(message)
  }

  return results
}
