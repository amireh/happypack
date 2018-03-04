const path = require('path');
const e = require('@happypack/example-utils');

module.exports = [
  ({
    context: path.resolve(__dirname),
    entry: { client: e.resolve(module, 'lib/a.js') },

    output: {
      path: e.outputDir(module),
      filename: '[name].js'
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: e.resolve(module, 'identity-loader.js')
        }
      ]
    }
  }),
  ({
    context: path.resolve(__dirname),
    entry: { server: e.resolve(module, 'lib/b.js') },

    output: {
      path: e.outputDir(module),
      filename: '[name].js'
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: e.resolve(module, 'identity-loader.js')
        }
      ]
    }
  }),
];