var path = require('path');
var HappyPack = require('../../');

module.exports = {
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

    loaders: [{ test: /\.ts$/, loader: 'ts' }]
  }
};

// module.exports = {
//   entry: path.resolve(__dirname, 'lib/index.ts'),

//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: '[name].js'
//   },

//   module: {
//     // preLoaders: [{ test: /\.ts$/, loader: 'tslint' }],
//     // postLoaders: [{ test: /\.ts$/, loader: 'tslint' }],
//     loaders: [{ test: /\.ts$/, loader: 'ts!tslint' }]
//   },

//   // tslint: {
//   //   // configuration: {
//   //   //   rules: {
//   //   //     quotemark: [true, "double"]
//   //   //   }
//   //   // },

//   //   // tslint errors are displayed by default as warnings
//   //   // set emitErrors to true to display them as errors
//   //   emitErrors: true,

//   //   // tslint does not interrupt the compilation by default
//   //   // if you want any file with tslint errors to fail
//   //   // set failOnHint to true
//   //   failOnHint: true,

//   //   // name of your formatter (optional)
//   //   // formatter: "yourformatter",

//   //   // // path to directory containing formatter (optional)
//   //   // formattersDirectory: "node_modules/tslint-loader/formatters/",

//   //   // These options are useful if you want to save output to files
//   //   // for your continuous integration server
//   //   fileOutput: {
//   //     // The directory where each file's report is saved
//   //     dir: path.resolve(__dirname, "lint-output"),

//   //     // The extension to use for each report's filename. Defaults to "txt"
//   //     ext: "txt",

//   //     // If true, all files are removed from the report directory at the beginning of run
//   //     clean: true,

//   //     // A string to include at the top of every report file.
//   //     // Useful for some report formats.
//   //     header: "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<checkstyle version=\"5.7\">",

//   //     // A string to include at the bottom of every report file.
//   //     // Useful for some report formats.
//   //     footer: "</checkstyle>"
//   //   }
//   // }
// };