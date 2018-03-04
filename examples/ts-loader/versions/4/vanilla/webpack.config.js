const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const e = require('@happypack/example-utils');

module.exports = ({
  context: path.resolve(__dirname), // to automatically find tsconfig.json
  entry: e.resolve(module, 'src/index.ts'),
  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },
  mode: 'development',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        include: [
          e.resolve(module, 'src'),
        ],
        loader: 'ts-loader',
        options: {
          happyPackMode: true,
          configFile: e.resolve(module, 'tsconfig.json')
        }
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', 'js']
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      tsconfig: e.resolve(module, 'tsconfig.json')
    })
  ]
});
