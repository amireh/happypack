const HappyPlugin = require('../HappyPlugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const { assert, createLoader, fixturePath, tempDir, clearCache } = require('../HappyTestUtils');

describe('[Integration] HappyPlugin', function() {
  beforeEach(function() {
    HappyPlugin.resetUID();
  });

  afterEach(function() {
    HappyPlugin.resetUID();
    clearCache();
  });

  it('compiles my files', function(done) {
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
          loader: path.resolve(__dirname, '../HappyLoader.js')
        }]
      },
      plugins: [
        new HappyPlugin({
          loaders: [loader.path]
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

  it("automatically uses loaders using happy: {}", function(done) {
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
          // happy: { id: 'js' },
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
          loaders: [ loader._name + '?foo=bar' ],
          // inferLoaders: true
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

  it.skip('works with multiple plugins', function(done) {
    const outputDir = tempDir('integration-[guid]');

    const compiler = webpack({
      entry: {
        main: fixturePath('integration/index.js'),
        styles: fixturePath('integration/index.css')
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [
          {
            happy: { id: 'js' },
            test: /\.js$/,
            loader: 'babel'
          },
          {
            happy: { id: 'css' },
            test: /.css$/,
            loader: 'style!css',
          }
        ]
      },

      plugins: [
        new HappyPlugin({ id: 'js', inferLoaders: true }),
        new HappyPlugin({ id: 'css', inferLoaders: true }),
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