var path = require('path');
var through = require('browserify-through');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },

  module: {
    postLoaders: [
      {
        loader: "transform?brfs"
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: ["transform?brfs"],
      },
      {
        test: /\.coffee$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loader: "transform?coffeeify"
      },
      // {
      //   test: /\.weirdjs$/,
      //   loader: "transform?0"
      // }
    ]
  },
  transforms: [
    // TODO
    function(file) {
    }
  ]
};