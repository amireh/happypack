var path = require('path');

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
        loaders: [
          path.resolve(__dirname, 'loader-c.js'),
          path.resolve(__dirname, 'loader-b.js'),
          path.resolve(__dirname, 'loader-a.js'),
        ],
      },
    ]
  },
};