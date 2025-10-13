const path = require('path');
const nodeExternals = require('webpack-node-externals');
const svgToMiniDataURI = require('mini-svg-data-uri');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Don't bundle node_modules
  externals: [nodeExternals({
    allowlist: [/\.svg$/] // But do process SVG files
  })],
  
  module: {
    rules: [
      // TypeScript files
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false, // We want type checking
          }
        },
        exclude: /node_modules/,
      },
      
      // SVG files
      {
        test: /\.svg$/,
        type: 'asset',
        generator: {
          // Convert SVGs to data URIs for SSR
          dataUrl: content => {
            if (typeof content !== 'string') {
              content = content.toString();
            }
            return svgToMiniDataURI(content);
          }
        }
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    // Support path aliases from tsconfig.json if any
    modules: ['node_modules', path.resolve(__dirname, 'src')]
  },
  
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    // Clean dist folder before each build
    clean: true,
  },
  
  // Source maps for debugging
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
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
};
