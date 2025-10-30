/**
 * JSX to HTML email renderer
 *
 * Renders ReactElement components to HTML strings for email templates.
 * Uses the same SSR infrastructure as the main application.
 *
 * Email Client Compatibility:
 * - React's renderToString automatically generates HTML5-compliant markup
 * - Inline styles are preserved (critical for email clients)
 * - Table-based layouts are supported (recommended for complex email layouts)
 * - All standard HTML elements work (div, p, h1-h6, a, img, table, etc.)
 *
 * Best Practices for Email HTML:
 * - Use inline styles instead of CSS classes (email clients strip <style> tags)
 * - Use table-based layouts for complex multi-column designs
 * - Specify explicit widths and heights for images
 * - Use absolute URLs for all links and images
 * - Test across multiple email clients (Gmail, Outlook, Apple Mail, etc.)
 */

import { renderToString } from "react-dom/server"
import type { ReactElement } from "react"
import { embedImage } from "../utils/base64-embedder"

/**
 * Renders a JSX ReactElement to an HTML string for email use
 *
 * This function uses React's server-side rendering to convert a ReactElement
 * into an HTML string. The resulting HTML is optimized for email clients:
 * - Inline styles are preserved
 * - No external CSS or JavaScript
 * - Clean, semantic HTML
 *
 * Email Client Compatibility Notes:
 * - Gmail: Supports most HTML/CSS, but strips some styles. Use inline styles.
 * - Outlook (Desktop): Limited CSS support. Use tables for layout.
 * - Apple Mail: Excellent support for modern HTML/CSS.
 * - Mobile clients: Generally good support, but keep designs simple.
 *
 * @param body - The JSX body to render (ReactElement)
 * @returns HTML string representation of the JSX
 * @throws Error if rendering fails
 *
 * @example
 * ```typescript
 * const email = <div style={{ color: 'blue' }}>Hello</div>
 * const html = renderEmailBody(email)
 * // Returns: '<div style="color:blue">Hello</div>'
 * ```
 */
export function renderEmailBody(body: ReactElement): string {
  try {
    const view = renderToString(body)

    // React's renderToString handles:
    // - Converting JSX to HTML
    // - Inlining styles (style objects → style attributes)
    // - Escaping dangerous content (XSS protection)
    // - Generating semantic, clean HTML

    return view
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown render error"
    throw new Error(`Failed to render JSX to HTML: ${errorMessage}`)
  }
}

/**
 * Wraps email content in a full HTML document structure
 *
 * Some email clients require a complete HTML document with DOCTYPE,
 * <html>, <head>, and <body> tags. This function wraps the rendered
 * JSX content in a proper HTML5 document structure.
 *
 * @param body - The JSX body to render
 * @param title - Optional email title (for <title> tag)
 * @returns Complete HTML document string
 *
 * @example
 * ```typescript
 * const email = <div>Content</div>
 * const fullHtml = renderEmailDocument(email, "Welcome Email")
 * ```
 */
export function renderEmailDocument(
  body: ReactElement,
  title = "Email",
): string {
  const view = renderEmailBody(body)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  ${view}
</body>
</html>`
}

/**
 * Embed a local image file as a base64 data URI for use in email templates
 *
 * This function converts a local image file to a base64-encoded data URI
 * that can be embedded directly in email HTML. This is useful for including
 * images in emails without requiring external hosting.
 *
 * **Important Notes:**
 * - Maximum image size: 100KB (emails should be kept small)
 * - Supported formats: PNG, JPEG, GIF, SVG, WebP, BMP, ICO
 * - Use this sparingly - large embedded images increase email size
 * - Consider using external URLs for large images instead
 *
 * @param filePath - Absolute path to the local image file
 * @returns Promise resolving to base64 data URI string
 * @throws Error if the image cannot be embedded (file not found, too large, unsupported format)
 *
 * @example
 * ```typescript
 * // In an email template component
 * const logoDataUri = await embedImageForEmail('/path/to/logo.png')
 *
 * const EmailTemplate = () => (
 *   <div>
 *     <img src={logoDataUri} alt="Company Logo" width="200" />
 *     <p>Welcome!</p>
 *   </div>
 * )
 * ```
 */
export async function embedImageForEmail(filePath: string): Promise<string> {
  const result = await embedImage(filePath)

  if (!result.success) {
    throw new Error(
      `Failed to embed image for email: ${result.error ?? "Unknown error"}`,
    )
  }

  // Type guard ensures dataUri exists when success is true
  if (!result.dataUri) {
    throw new Error("Unexpected error: dataUri is missing from success result")
  }

  return result.dataUri
}

/**
 * Re-export embedImage for direct use in templates
 * This allows templates to handle errors themselves if needed
 */
export { embedImage }
