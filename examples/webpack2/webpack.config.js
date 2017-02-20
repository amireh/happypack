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
      loaders: [{
        loader: path.resolve(__dirname, 'identity-loader.js'),
        options: { foo: 'bar' }
      }, {
        loader: 'babel-loader',
        options: {
          presets: [[ 'es2015', { modules: false }], 'react' ],
          plugins: [
            ['transform-runtime', {
              polyfill: false,
              regenerator: false
            }],
          ]
        }
      }],
      threads: 2
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        use: path.resolve(__dirname, '../../loader')
      }
    ]
  }
};