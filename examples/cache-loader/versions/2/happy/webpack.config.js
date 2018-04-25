const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      use: [
        {
          loader: 'cache-loader',
          options: {
            cacheDirectory: path.join(e.outputDir(module), '.cache')
          }
        },
        'babel-loader?presets[]=es2015&presets[]=react'
      ],
      threads: 2
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [ e.resolve(module, 'lib') ],
        use: [ e.happyLoader ]
      }
    ]
  }
}
