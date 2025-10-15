// Webpack asset module type definition for SVG files
// SVGs will be converted to data URIs by webpack
// Asset type declarations for webpack asset/resource imports
// These imports return URL paths (strings) to the asset files

declare module "*.svg" {
  const content: string
  export default content
}

declare module "*.png" {
  const content: string
  export default content
}

declare module "*.jpg" {
  const content: string
  export default content
}

declare module "*.jpeg" {
  const content: string
  export default content
}

declare module "*.gif" {
  const content: string
  export default content
}

declare module "*.webp" {
  const content: string
  export default content
}

declare module "*.css" {
  const content: string
  export default content
}
