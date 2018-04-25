const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

module.exports = ({
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/index.ts'),
  mode: 'development',
  devtool: false,

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      use: [ 'tslint-loader' ],
      threads: 2
    })
  ],

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts$/,
        loader: e.happyLoader,
        include: [ e.resolve(module, 'lib') ]
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  }
})