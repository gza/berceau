/**
 * Base64 image embedding helper
 *
 * Converts local image files to base64 data URIs for inline use in emails.
 * This helps ensure images display properly in email clients without external
 * dependencies.
 */

import * as fs from "fs/promises"
import * as path from "path"

/**
 * Maximum image size in bytes (100KB - reasonable for email embedding)
 * Keep this well below MAX_HTML_SIZE_BYTES (500KB) to allow for multiple images
 * and other HTML content in a single email.
 */
const MAX_IMAGE_SIZE_BYTES = 100 * 1024

/**
 * Supported image MIME types
 */
const IMAGE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
}

/**
 * Result of image embedding operation
 */
export interface EmbedImageResult {
  success: boolean
  dataUri?: string
  error?: string
}

/**
 * Gets MIME type from file extension
 *
 * @param filePath - Path to the image file
 * @returns MIME type or undefined if not supported
 */
function getMimeType(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase()
  return IMAGE_MIME_TYPES[ext]
}

/**
 * Embeds a local image file as a base64 data URI
 *
 * @param filePath - Absolute path to the image file
 * @returns Promise resolving to embed result with data URI or error
 */
export async function embedImage(filePath: string): Promise<EmbedImageResult> {
  try {
    // Check if file exists
    const stats = await fs.stat(filePath)

    // Check file size
    if (stats.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        error: `Image size exceeds maximum (${MAX_IMAGE_SIZE_BYTES} bytes, got ${stats.size} bytes)`,
      }
    }

    // Get MIME type
    const mimeType = getMimeType(filePath)
    if (!mimeType) {
      return {
        success: false,
        error: `Unsupported image format: ${path.extname(filePath)}`,
      }
    }

    // Read file and convert to base64
    const buffer = await fs.readFile(filePath)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${mimeType};base64,${base64}`

    return {
      success: true,
      dataUri,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error)
    return {
      success: false,
      error: `Failed to read image file: ${errorMessage}`,
    }
  }
}

/**
 * Batch embed multiple images from local file paths
 *
 * @param sources - Array of file paths
 * @returns Promise resolving to array of embed results
 */
export async function embedImages(
  sources: string[],
): Promise<EmbedImageResult[]> {
  return await Promise.all(sources.map((source) => embedImage(source)))
}
