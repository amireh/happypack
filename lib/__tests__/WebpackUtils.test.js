'use strict';

const Subject = require('../WebpackUtils');
const webpack = require('webpack');
const path = require('path');
const { assert } = require('chai');

describe('WebpackUtils', function() {
  describe('.resolveLoaders', function() {
    let compiler;

    it('resolves the full path of a loader', function(done) {
      runWithLoaders([{ test: /.js$/, loader: 'babel' }], function(err, loaders) {
        if (err) return done(err);

        assert.equal(loaders.length, 1);
        assert.equal(loaders[0].path, path.resolve(__dirname, '../../node_modules/babel-loader/index.js'));

        done();
      });
    });

    it('resolves the full path and query of a loader', function(done) {
      runWithLoaders([{ test: /.js$/, loader: 'babel?presets[]=es2015' }], function(err, loaders) {
        if (err) return done(err);

        assert.equal(loaders.length, 1);
        assert.equal(loaders[0].path, path.resolve(__dirname, '../../node_modules/babel-loader/index.js'));
        assert.equal(loaders[0].query, '?presets[]=es2015');

        done();
      });
    });

    function runWithLoaders(loaders, done) {
      compiler = webpack({
        module: {
          loaders: loaders
        }
      })

      Subject.resolveLoaders(compiler, compiler.options.module.loaders.map(l => l.loader), done);
    }
  });
});