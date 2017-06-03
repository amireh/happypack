'use strict';

var process = require('process');
var path = require('path');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    context: __dirname, // to automatically find tsconfig.json
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].raw.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: { transpileOnly: true }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', 'js']
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin()
    ]
};
