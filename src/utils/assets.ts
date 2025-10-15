/**
 * Asset path helper for server-side rendering
 * Resolves asset paths to be served by NestJS static file middleware
 */

/**
 * Get the URL path for a static asset
 * @param assetPath - Path to the asset file from src root
 *   (e.g., 'systemComponents/welcome/ui/welcome.svg')
 * @returns URL path to access the asset
 */
export function getAssetUrl(assetPath: string): string {
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath
  return `/assets/${cleanPath}`
}
