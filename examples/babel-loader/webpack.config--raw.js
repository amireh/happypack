var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loader: 'babel'
      }
    ]
  }
};