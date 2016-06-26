var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, '../lib/index.ts'),

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    loaders: [{ test: /\.ts$/, loader: 'awesome-typescript-loader' }]
  },
};