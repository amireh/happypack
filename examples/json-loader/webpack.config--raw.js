var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json',
      },
    ],
  }
};