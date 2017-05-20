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
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: [
          {
            loader: 'babel-loader',
            query: {
              plugins: [
                'transform-runtime',
              ],
              presets: ['es2015', 'react'],
              cacheDirectory: false
            }
          }
        ]
      }
    ]
  }
};