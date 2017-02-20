var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
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
      }
    ]
  }
};