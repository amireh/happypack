'use strict';

var process = require('process');
var path = require('path');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var HappyPack = require('../../');

module.exports = {
    context: __dirname, // to automatically find tsconfig.json
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: path.resolve(__dirname, '../../loader?id=ts')
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', 'js']
    },
    plugins: [
        new HappyPack({
            id: 'ts',
            threads: 2,
            loaders: [
                {
                    path: 'ts-loader',
                    query: { happyPackMode: true }
                }
            ]
        }),
        new ForkTsCheckerWebpackPlugin()
    ]
};
