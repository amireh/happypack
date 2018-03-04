const path = require('path');
const e = require('@happypack/example-utils')
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: path.join(e.exampleDir(module), 'lib/a.js'),

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [{
        path: 'babel',
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
    loaders: [
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
