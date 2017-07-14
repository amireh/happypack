var path = require('path');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var HappyPack = require('../../');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname), // to automatically find tsconfig.json
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        loader: path.resolve(__dirname, '../../loader?id=ts')
      }
    ]
  },
  resolve: {
    extensions: [ '', '.ts', '.tsx', 'js']
  },
  plugins: [
    new HappyPack({
      id: 'ts',
      threads: 2,
      loaders: [
        {
          path: 'ts-loader',
          query: { happyPackMode: true }
        }
      ]
    }),
    new ForkTsCheckerWebpackPlugin()
  ]
});
