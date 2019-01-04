const path = require('path');
const e = require('@happypack/example-utils');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  devtool: false,

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      use: [
        'babel-loader?presets[]=env&presets[]=react'
      ],
      threads: 2
    }),

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
        use: [ e.happyLoader ]
      }
    ]
  }
}
