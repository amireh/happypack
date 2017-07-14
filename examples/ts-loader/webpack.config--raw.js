var path = require('path');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname), // to automatically find tsconfig.json
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        loader: 'ts-loader',
        query: { transpileOnly: true }
      }
    ]
  },
  resolve: {
    extensions: [ '', '.ts', '.tsx', 'js']
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin()
  ]
});
