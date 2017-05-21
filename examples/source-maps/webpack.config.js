var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: require.resolve('./lib/a.js'),
  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [
        require.resolve('./identity-loader.js'),
        'babel',
      ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [ path.resolve(__dirname, '../../loader') ]
      }
    ]
  }
};