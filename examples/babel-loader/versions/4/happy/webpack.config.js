const path = require('path');
const e = require('@happypack/example-utils')
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: path.join(e.exampleDir(module), 'lib/a.js'),
  mode: 'development',
  devtool: false,

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      use: [{
        path: 'babel-loader',
        query: {
          plugins: [
            require.resolve('babel-plugin-transform-runtime'),
          ],
          presets: [
            require.resolve('babel-preset-es2015'),
            require.resolve('babel-preset-react')
          ],
          cacheDirectory: false
        }
      }],
      threads: 2
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.join(e.exampleDir(module), 'lib/')
        ],
        loader: e.happyLoader
      }
    ]
  }
}
