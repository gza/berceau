const nodeExternals = require("webpack-node-externals")
const { RunScriptWebpackPlugin } = require("run-script-webpack-plugin")
const path = require("path")

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ["webpack/hot/poll?100", options.entry],
    // Set output publicPath to root
    output: {
      ...options.output,
      publicPath: "/",
    },
    externals: [
      nodeExternals({
        // Allow webpack to process these files (not treat as external node_modules)
        allowlist: ["webpack/hot/poll?100", /\.(svg|png|jpe?g|gif|webp|css)$/i],
      }),
    ],
    module: {
      rules: [
        ...options.module.rules,
        // Asset handling - copy files to dist/assets/
        {
          test: /\.(svg|png|jpe?g|gif|webp)$/i,
          type: "asset/resource",
          generator: {
            // Output to dist/assets/ (which Express serves at /assets/)
            filename: (pathData) => {
              // Extract path relative to src/ directory
              const match = pathData.filename.match(/src[/\\](.+)/)
              const relativePath = match
                ? match[1]
                : path.basename(pathData.filename)
              // Output to assets/ folder, which will be in dist/assets/
              return `assets/${relativePath}`
            },
          },
        },
        // CSS handling - copy files to dist/assets/
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
      ],
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
      }),
    ],
  }
}
