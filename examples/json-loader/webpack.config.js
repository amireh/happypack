var path = require('path');
var HappyPack = require('../../');
var HappyLoader = path.resolve(__dirname, '../../loader');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      cache: process.env.HAPPY_CACHE === '1',
      threads: 2,
      loaders: [
        'json'
      ]
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: HappyLoader,
      },
    ],
  }
};