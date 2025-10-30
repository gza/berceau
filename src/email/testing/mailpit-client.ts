/**
 * Mailpit API Client
 *
 * HTTP client for interacting with Mailpit API during testing.
 * Provides methods to query messages, search by recipient, and retrieve message details.
 *
 * @see https://mailpit.axllent.org/docs/api-v1/
 */

/**
 * Mailpit message summary from list endpoint
 */
export interface MailpitMessageSummary {
  /** Message ID */
  ID: string
  /** Message ID header value */
  MessageID: string
  /** Sender address */
  From: MailpitAddress
  /** Recipient addresses */
  To: MailpitAddress[]
  /** CC addresses */
  Cc: MailpitAddress[]
  /** BCC addresses */
  Bcc: MailpitAddress[]
  /** Email subject */
  Subject: string
  /** Created timestamp (ISO 8601) */
  Created: string
  /** Email size in bytes */
  Size: number
  /** Attachment count */
  Attachments: number
  /** Read status */
  Read: boolean
}

/**
 * Mailpit address object
 */
export interface MailpitAddress {
  /** Display name (optional) */
  Name?: string
  /** Email address */
  Address: string
}

/**
 * Mailpit message detail from get message endpoint
 */
export interface MailpitMessageDetail {
  /** Message ID */
  ID: string
  /** Message ID header value */
  MessageID: string
  /** Sender address */
  From: MailpitAddress
  /** Recipient addresses */
  To: MailpitAddress[]
  /** CC addresses */
  Cc: MailpitAddress[]
  /** BCC addresses */
  Bcc: MailpitAddress[]
  /** Reply-To addresses */
  ReplyTo: MailpitAddress[]
  /** Email subject */
  Subject: string
  /** Created timestamp (ISO 8601) */
  Created: string
  /** Email size in bytes */
  Size: number
  /** HTML content */
  HTML: string
  /** Plain text content */
  Text: string
  /** Inline attachments */
  Inline: MailpitAttachment[]
  /** Regular attachments */
  Attachments: MailpitAttachment[]
}

/**
 * Mailpit attachment metadata
 */
export interface MailpitAttachment {
  /** Attachment ID */
  PartID: string
  /** Filename */
  FileName: string
  /** Content type */
  ContentType: string
  /** Size in bytes */
  Size: number
}

/**
 * Mailpit API client configuration
 */
export interface MailpitClientConfig {
  /** Mailpit API base URL (default: http://localhost:8025) */
  baseUrl?: string
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number
}

/**
 * Mailpit API client for testing
 */
export class MailpitClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(config: MailpitClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? "http://localhost:8025"
    this.timeoutMs = config.timeoutMs ?? 5000
  }

  /**
   * List all messages in Mailpit inbox
   *
   * @returns Array of message summaries (most recent first)
   * @throws Error if API request fails
   */
  async listMessages(): Promise<MailpitMessageSummary[]> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/v1/messages`,
    )

    if (!response.ok) {
      throw new Error(
        `Mailpit API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = (await response.json()) as {
      messages?: MailpitMessageSummary[]
    }
    return data.messages ?? []
  }

  /**
   * Get message details by ID
   *
   * @param messageId - Mailpit message ID (from listMessages)
   * @returns Message detail with HTML/text content
   * @throws Error if message not found or API request fails
   */
  async getMessage(messageId: string): Promise<MailpitMessageDetail> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/v1/message/${messageId}`,
    )

    if (!response.ok) {
      throw new Error(
        `Mailpit API error: ${response.status} ${response.statusText}`,
      )
    }

    return (await response.json()) as MailpitMessageDetail
  }

  /**
   * Search messages by recipient email address
   *
   * @param recipient - Email address to search for (in To, Cc, or Bcc)
   * @returns Array of messages sent to the recipient
   */
  async searchByRecipient(recipient: string): Promise<MailpitMessageSummary[]> {
    const messages = await this.listMessages()
    return messages.filter((msg) => {
      const allRecipients = [...msg.To, ...(msg.Cc || []), ...(msg.Bcc || [])]
      return allRecipients.some(
        (addr) => addr.Address.toLowerCase() === recipient.toLowerCase(),
      )
    })
  }

  /**
   * Search messages by subject (case-insensitive partial match)
   *
   * @param subject - Subject text to search for
   * @returns Array of messages matching the subject
   */
  async searchBySubject(subject: string): Promise<MailpitMessageSummary[]> {
    const messages = await this.listMessages()
    const lowerSubject = subject.toLowerCase()
    return messages.filter((msg) =>
      msg.Subject.toLowerCase().includes(lowerSubject),
    )
  }

  /**
   * Delete all messages from Mailpit inbox
   *
   * @throws Error if API request fails
   */
  async clearInbox(): Promise<void> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/v1/messages`,
      {
        method: "DELETE",
      },
    )

    if (!response.ok) {
      throw new Error(
        `Mailpit API error: ${response.status} ${response.statusText}`,
      )
    }
  }

  /**
   * Delete a specific message by ID
   *
   * @param messageId - Mailpit message ID
   * @throws Error if API request fails
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/v1/message/${messageId}`,
      {
        method: "DELETE",
      },
    )

    if (!response.ok) {
      throw new Error(
        `Mailpit API error: ${response.status} ${response.statusText}`,
      )
    }
  }

  /**
   * Check if Mailpit API is reachable
   *
   * @returns true if Mailpit is running and accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v1/info`,
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch with timeout using AbortController
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Create a default Mailpit client instance
 */
export function createMailpitClient(
  config?: MailpitClientConfig,
): MailpitClient {
  return new MailpitClient(config)
}
