'use strict';

const HappyPlugin = require('../HappyPlugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const TestUtils = require('../HappyTestUtils');
const { assert, createLoader, fixturePath, tempDir, } = require('../HappyTestUtils');
const multiline = require('multiline-slash');

describe('[Integration] HappyPlugin', function() {
  TestUtils.IntegrationSuite(this);

  it('compiles my files', function(done) {
    const outputDir = tempDir('integration-[guid]');
    const identityLoader = createLoader(function(s) {
      return s;
    });

    const loader = createLoader(function(s) {
      this.addDependency(this.resource.replace('.js', '.tmp.js'));

      return s + '\n// HAPPY!';
    });

    const file1 = TestUtils.createFile('a.js', multiline(function() {
      // require('./b');
    }));

    const file2 = TestUtils.createFile('b.js', multiline(function() {
      // console.log("Hello World!");
    }));

    const file3 = TestUtils.createFile('c.js', multiline(function() {
      // console.log("Hello Baz!");
    }));

    const compiler = webpack({
      entry: {
        main: [
          file1.getPath(),
          file3.getPath()
        ]
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: path.resolve(__dirname, '../HappyLoader.js')
        }]
      },
      plugins: [
        new HappyPlugin({
          cache: false,
          loaders: [loader.path, identityLoader.path]
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      const stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      done();
    });
  });

  it("resolves my loaders using webpack's loader resolver", function(done) {
    const outputDir = tempDir('integration-[guid]');
    const loader = createLoader(s => s + '\n// HAPPY!');

    const compiler = webpack({
      entry: {
        main: [
          fixturePath('integration/index.js')
        ]
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: path.resolve(__dirname, '../HappyLoader.js'),
        }]
      },

      resolveLoader: {
        root: path.dirname(loader.path)
      },

      plugins: [
        new HappyPlugin({
          loaders: [loader._name, 'babel']
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      const stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      done();
    });
  });

  it("passes query string to the loader", function(done) {
    const outputDir = tempDir('integration-[guid]');
    const loader = createLoader(function(s) {
      return s + `\n// ${this.query}`
    });

    const compiler = webpack({
      entry: {
        main: [
          fixturePath('integration/index.js')
        ]
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: path.resolve(__dirname, '../HappyLoader') + '?id=js'
        }]
      },

      resolveLoader: {
        root: path.dirname(loader.path)
      },

      plugins: [
        new HappyPlugin({
          id: 'js',
          loaders: [ loader._name + '?string=HAPPY' ],
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      const stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// ?string=HAPPY');

      done();
    });
  });

  // TODO pitch loader support
  it.skip('works with multiple plugins', function(done) {
    const outputDir = tempDir('integration-[guid]');

    const compiler = webpack({
      entry: {
        main: fixturePath('integration/index.js'),
        styles: fixturePath('integration/index.less')
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: path.resolve(__dirname, '../HappyLoader') + '?id=js'
          },
          {
            test: /.less$/,
            loader: path.resolve(__dirname, '../HappyLoader') + '?id=styles'
          }
        ]
      },

      plugins: [
        new HappyPlugin({ id: 'js', loaders: [ 'babel' ] }),
        new HappyPlugin({ id: 'styles', loaders: [ 'style!css!less' ] }),
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      const stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');
      assert.match(fs.readFileSync(path.join(outputDir, 'styles.js'), 'utf-8'), "background-color: red;");

      done();
    });
  });
});