var path = require('path');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      cache: false,

      loaders: [
        {
          path: path.resolve(__dirname, '../../node_modules/babel-loader/index.js'),
          query: '?presets[]=es2015,presets[]=react'
        },
        {
          path: path.resolve(__dirname, '../identity-loader.js')
        }
      ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  }
};