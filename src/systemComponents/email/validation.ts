/**
 * Email validation utilities
 *
 * Validates email addresses, subjects, and HTML content according to
 * the requirements defined in the outgoing email feature specification.
 */

import type { EmailAddress } from "../../email/types"

/**
 * Maximum subject length in characters
 */
export const MAX_SUBJECT_LENGTH = 200

/**
 * Maximum HTML size in bytes (500KB)
 */
export const MAX_HTML_SIZE_BYTES = 500 * 1024

/**
 * RFC 5322 compliant email validation regex
 * This is a reasonable approximation - not a perfect RFC 5322 parser
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates an email address against RFC 5322 rules
 *
 * @param email - The email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmailAddress(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email address is required" }
  }

  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: "Email address cannot be empty" }
  }

  if (trimmed.length > 254) {
    return {
      valid: false,
      error: "Email address exceeds maximum length (254 characters)",
    }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Email address is not valid" }
  }

  // Check local part (before @) length
  const [localPart, domain] = trimmed.split("@")
  if (localPart.length > 64) {
    return {
      valid: false,
      error: "Email local part exceeds maximum length (64 characters)",
    }
  }

  // Basic domain validation
  if (!domain || domain.length === 0) {
    return { valid: false, error: "Email domain is missing" }
  }

  return { valid: true }
}

/**
 * Validates multiple email addresses
 *
 * @param emails - Array of email addresses to validate
 * @returns Validation result with first error encountered if any invalid
 */
export function validateEmailAddresses(
  emails: EmailAddress[],
): ValidationResult {
  if (!Array.isArray(emails)) {
    return { valid: false, error: "Email addresses must be an array" }
  }

  if (emails.length === 0) {
    return { valid: false, error: "At least one email address is required" }
  }

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    const result = validateEmailAddress(email)
    if (!result.valid) {
      return {
        valid: false,
        error: `Email address at index ${i}: ${result.error ?? "Unknown validation error"}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validates email subject
 *
 * @param subject - The email subject to validate
 * @returns Validation result with error message if invalid
 */
export function validateSubject(subject: string): ValidationResult {
  if (!subject || typeof subject !== "string") {
    return { valid: false, error: "Subject is required" }
  }

  const trimmed = subject.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: "Subject cannot be empty" }
  }

  if (trimmed.length > MAX_SUBJECT_LENGTH) {
    return {
      valid: false,
      error: `Subject exceeds maximum length (${MAX_SUBJECT_LENGTH} characters)`,
    }
  }

  return { valid: true }
}

/**
 * Validates HTML content size
 *
 * @param html - The HTML content to validate
 * @returns Validation result with error message if invalid
 */
export function validateHtmlSize(html: string): ValidationResult {
  if (html === null || html === undefined || typeof html !== "string") {
    return { valid: false, error: "HTML content is required" }
  }

  // Allow empty HTML (minimal emails)
  const sizeInBytes = Buffer.byteLength(html, "utf8")

  if (sizeInBytes > MAX_HTML_SIZE_BYTES) {
    return {
      valid: false,
      error: `HTML content exceeds maximum size (500KB)`,
    }
  }

  return { valid: true }
}

/**
 * Validates all email input fields
 *
 * @param from - Sender email address
 * @param to - Recipient email addresses
 * @param subject - Email subject
 * @param html - HTML content
 * @returns Validation result with first error encountered if any invalid
 */
export function validateEmailInput(
  from: EmailAddress,
  to: EmailAddress[],
  subject: string,
  html: string,
): ValidationResult {
  // Validate sender
  const fromResult = validateEmailAddress(from)
  if (!fromResult.valid) {
    return { valid: false, error: `Sender email: ${fromResult.error}` }
  }

  // Validate recipients
  const toResult = validateEmailAddresses(to)
  if (!toResult.valid) {
    return { valid: false, error: `Recipient emails: ${toResult.error}` }
  }

  // Validate subject
  const subjectResult = validateSubject(subject)
  if (!subjectResult.valid) {
    return subjectResult
  }

  // Validate HTML size
  const htmlResult = validateHtmlSize(html)
  if (!htmlResult.valid) {
    return htmlResult
  }

  return { valid: true }
}
