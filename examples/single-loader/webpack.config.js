var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [{ path: path.resolve(__dirname, '../transform__babel.js') }],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  }
};