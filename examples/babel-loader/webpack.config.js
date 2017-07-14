var path = require('path');
var HappyPack = require('../../');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [{
        path: 'babel',
        query: {
          plugins: [
            'transform-runtime',
          ],
          presets: ['es2015', 'react'],
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
        include: [ path.resolve(__dirname, 'lib') ],
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  }
});
