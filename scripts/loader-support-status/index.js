#!/usr/bin/env node

var HappyPlugin = require('../../');
var webpack = require('webpack');
var fs = require('fs');
var path = require('path');

var loader = path.resolve(__dirname, 'loader.js');
var inputPaths = {
  webpack: path.resolve(__dirname, 'lib/a.js'),
  happypack: path.resolve(__dirname, 'lib/b.js'),
};

var statPaths = {
  webpack: path.resolve(__dirname, 'dist/a.json'),
  happypack: path.resolve(__dirname, 'dist/b.json'),
}

webpack({
  entry: [ inputPaths.webpack, inputPaths.happypack ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  bail: true,

  module: {
    loaders: [
      {
        test: /a\.js$/,
        loader: loader + '?out=' + statPaths.webpack
      },
      {
        test: /b\.js$/,
        loader: path.resolve(__dirname, '../../loader')
      }
    ]
  },

  plugins: [
    new HappyPlugin({
      loaders: [
        loader + '?out=' + statPaths.happypack
      ],
      threads: 1,
      cache: false,
      verbose: false
    })
  ]
}, function(err, rawStats) {
  if (err) {
    throw err;
  }

  var webpackLoaderContext = require(statPaths.webpack);
  var happypackLoaderContext = require(statPaths.happypack);
  var stats = {
    missing: [],
    mismatch: [],
    supported: []
  };

  Object.keys(webpackLoaderContext).forEach(function(key) {
    if (!happypackLoaderContext.hasOwnProperty(key)) {
      stats.missing.push(key);
    }
    else if (webpackLoaderContext[key] !== happypackLoaderContext[key]) {
      stats.mismatch.push(key);
    }
    else {
      stats.supported.push(key);
    }
  });

  if (stats.supported.length) {
    console.log('Supported properties:');
    console.log(Array(72).join('-'));

    stats.supported.sort().forEach(function(key, index) {
      console.warn('%d. "%s" of type "%s"', index+1, key, webpackLoaderContext[key]);
    });

    console.log('');
  }

  if (stats.missing.length) {
    console.log('Missing properties:');
    console.log(Array(72).join('-'));

    stats.missing.sort().forEach(function(key, index) {
      console.warn('%d. "%s" of type "%s"', index+1, key, webpackLoaderContext[key]);
    });

    console.log('');
  }

  if (stats.mismatch.length) {
    console.log('Property type mismatch:');
    console.log(Array(72).join('-'));

    stats.mismatch.sort().forEach(function(key, index) {
      console.warn('%d. "%s" is of type "%s" in webpack, but "%s" in happypack.',
        index+1,
        key,
        webpackLoaderContext[key],
        happypackLoaderContext[key]
      );
    });
  }
});