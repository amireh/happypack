const path = require('path');
const e = require('@happypack/example-utils');

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [ e.resolve(module, 'lib') ],
        use: [
          {
            loader: 'cache-loader',
            options: {
              cacheDirectory: path.join(e.outputDir(module), '.cache')
            }
          },
          'babel-loader?presets[]=es2015&presets[]=react'
        ],
      }
    ]
  }
}
