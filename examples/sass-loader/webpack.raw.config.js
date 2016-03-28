var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.scss'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },

  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: 'style!css!sass',
      }
    ]
  }
};