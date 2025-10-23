const path = require("path")
const nodeExternals = require("webpack-node-externals")
const svgToMiniDataURI = require("mini-svg-data-uri")
const ComponentDiscoveryPlugin = require("./build/component-discovery-plugin")
const DatabaseSchemaPlugin = require("./build/database-schema-plugin")

module.exports = {
  entry: "./src/main.ts",
  target: "node",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",

  // Don't bundle node_modules
  externals: [
    nodeExternals({
      allowlist: [/\.svg$/], // But do process SVG files
    }),
  ],

  module: {
    rules: [
      // TypeScript files
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: false, // We want type checking
          },
        },
        exclude: [
          /node_modules/,
          /\.spec\.tsx?$/, // Exclude test files
          /__tests__/, // Exclude test directories
        ],
      },

      // SVG files (inline as data URIs for SSR)
      {
        test: /\.svg$/,
        type: "asset",
        generator: {
          // Convert SVGs to data URIs for SSR
          dataUrl: (content) => {
            if (typeof content !== "string") {
              content = content.toString()
            }
            return svgToMiniDataURI(content)
          },
        },
      },

      // CSS files - copy to dist/assets/
      {
        test: /\.css$/i,
        type: "asset/resource",
        generator: {
          filename: (pathData) => {
            const match = pathData.filename.match(/src[/\\](.+)/)
            const relativePath = match
              ? match[1]
              : path.basename(pathData.filename)
            return `assets/${relativePath}`
          },
        },
      },

      // Image files - copy to dist/assets/
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: (pathData) => {
            const match = pathData.filename.match(/src[/\\](.+)/)
            const relativePath = match
              ? match[1]
              : path.basename(pathData.filename)
            return `assets/${relativePath}`
          },
        },
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    // Support path aliases from tsconfig.json if any
    modules: ["node_modules", path.resolve(__dirname, "src")],
  },

  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    // Clean dist folder before each build
    clean: true,
  },

  // Plugins
  plugins: [
    new DatabaseSchemaPlugin({ rootDir: __dirname }),
    new ComponentDiscoveryPlugin({ rootDir: __dirname }),
  ],

  // Source maps for debugging
  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",

  // Performance hints
  performance: {
    hints: false, // Disable for server bundle
  },

  // Stats configuration for cleaner output
  stats: {
    colors: true,
    modules: false,
    children: false,
  },
}
