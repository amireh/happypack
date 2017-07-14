var path = require('path');
var HappyPack = require('../../');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/index.ts'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [ 'tslint' ],
      threads: 2
    })
  ],

  module: {
    preLoaders: [
      {
        test: /\.ts$/,
        loader: path.resolve(__dirname, '../../loader'),
        include: [ path.resolve(__dirname, 'lib') ]
      }
    ],

    loaders: [{ test: /\.ts$/, loader: 'ts-loader' }]
  }
});