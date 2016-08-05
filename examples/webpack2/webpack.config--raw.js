var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, 'identity-loader.js')
      }
    ]
  }
};