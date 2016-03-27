var path = require('path');
var through = require('browserify-through');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: [ path.resolve(__dirname, 'loader.js') ],
      },
    ]
  },
};