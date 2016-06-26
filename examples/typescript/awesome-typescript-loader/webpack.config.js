var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, '../lib/index.ts'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      cache: process.env.HAPPY_CACHE === '1',
      loaders: [ 'awesome-typescript-loader' ],
      threads: 2
    })
  ],

  module: {
    loaders: [{
      test: /\.ts$/, loader: path.resolve(__dirname, '../../loader.js')
    }]
  }
};
