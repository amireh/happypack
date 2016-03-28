var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.scss'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [ 'style!css!sass' ],
      cache: false,
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  }
};