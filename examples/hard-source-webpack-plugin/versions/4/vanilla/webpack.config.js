const path = require('path');
const e = require('@happypack/example-utils');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  mode: 'development',
  devtool: false,

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HardSourceWebpackPlugin({
      cacheDirectory: path.join(e.outputDir(module), '.cache/[confighash]'),
      info: {
        mode: 'none',
        level: 'debug',
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [ e.resolve(module, 'lib') ],
        use: [
          'babel-loader?presets[]=env&presets[]=react'
        ],
      }
    ]
  }
}
