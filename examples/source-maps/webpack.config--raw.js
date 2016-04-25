var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'lib/a.js'),
  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [
          require.resolve('./identity-loader.js'),
          'babel'
        ]
      }
    ]
  }
};