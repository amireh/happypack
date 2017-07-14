var path = require('path');
var HappyPack = require('../../');
var HappyLoader = path.resolve(__dirname, '../../loader');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      threads: 2,
      loaders: [
        'json'
      ]
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: HappyLoader,
      },
    ],
  }
});