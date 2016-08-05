var HappyPlugin = require('../HappyPlugin');
var path = require('path');
var fs = require('fs');
var assert = require('chai').assert;
var webpack = require('webpack');
var TestUtils = require('../HappyTestUtils');
var multiline = require('multiline-slash');

describe('[Integration] HappyPlugin', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('compiles my files', function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var identityLoader = testSuite.createLoader(function(s) {
      return s;
    });

    var loader = testSuite.createLoader(function(s) {
      this.addDependency(this.resource.replace('.js', '.tmp.js'));

      return s + '\n// HAPPY!';
    });

    var file1 = testSuite.createFile('a.js', multiline(function() {
      // require('./b');
    }));

    /*var file2 = */testSuite.createFile('b.js', multiline(function() {
      // console.log("Hello World!");
    }));

    var file3 = testSuite.createFile('c.js', multiline(function() {
      // console.log("Hello Baz!");
    }));

    var compiler = webpack({
      entry: {
        main: [
          file1.path,
          file3.path,
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

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      done();
    });
  });

  it("resolves my loaders using webpack's loader resolver", function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var loader = testSuite.createLoader(function(s) { return s + '\n// HAPPY!'; });

    var compiler = webpack({
      entry: {
        main: [
          TestUtils.fixturePath('integration/index.js')
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
          loaders: [loader._name]
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      done();
    });
  });

  it("passes query string to the loader", function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var loader = testSuite.createLoader(function(s) {
      return s + '\n// ' + this.query;
    });

    var compiler = webpack({
      entry: {
        main: [
          TestUtils.fixturePath('integration/index.js')
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

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// ?string=HAPPY');

      done();
    });
  });

  it("passes query object to the loader", function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var loader = testSuite.createLoader(function(s) {
      return s + '\n// ' + this.query;
    });

    var compiler = webpack({
      entry: {
        main: [
          TestUtils.fixturePath('integration/index.js')
        ]
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          happy: { id: 'js' },
          loader: loader._name,
          query: {
            string: 'HAPPY'
          }
        }]
      },

      resolveLoader: {
        root: path.dirname(loader.path)
      },

      plugins: [
        new HappyPlugin({ id: 'js' })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// ?{"string":"HAPPY"}');

      done();
    });
  });

  it("passes compiler options down to the background loaders", function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var loader = testSuite.createLoader(function() {
      return '// ' + this.options.output.path;
    });

    var compiler = webpack({
      entry: {
        main: TestUtils.fixturePath('integration/index.js')
      },

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      plugins: [
        new HappyPlugin({
          loaders: [ loader.path ],
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (TestUtils.assertNoWebpackErrors(err, rawStats, done)) {
        return;
      }

      assert.match(
        fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'),
        '// ' + outputDir
      );

      done();
    });
  });
});