const path = require('path');
const e = require('@happypack/example-utils');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { HappyPack } = e;

module.exports = ({
  context: path.resolve(__dirname), // to automatically find tsconfig.json
  entry: e.resolve(module, 'src/index.ts'),
  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },
  mode: 'development',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        include: [
          e.resolve(module, 'src'),
        ],
        use: `${e.happyLoader}?id=ts`
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', 'js']
  },
  plugins: [
    new HappyPack({
      id: 'ts',
      threads: 2,
      use: [
        {
          path: 'ts-loader',
          query: {
            happyPackMode: true,
            configFile: e.resolve(module, 'tsconfig.json')
          }
        }
      ]
    }),
    new ForkTsCheckerWebpackPlugin({
      tsconfig: e.resolve(module, 'tsconfig.json')
    })
  ]
});
