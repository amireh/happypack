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
      loaders: [
        {
          loader: 'cache-loader',
          options: {
            cacheDirectory: path.resolve(__dirname, '.cache--happypack')
          }
        },
        'babel-loader?presets[]=es2015&presets[]=react'
      ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: [ path.resolve(__dirname, '../../loader')]
      }
    ]
  }
});
