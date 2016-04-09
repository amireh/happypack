var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      cache: process.env.HAPPY_CACHE === '1',
      loaders: [ 'babel' ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  }
};