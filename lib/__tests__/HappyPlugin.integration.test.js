var HappyPlugin = require('../HappyPlugin');
var path = require('path');
var fs = require('fs');
var assert = require('chai').assert;
var webpack = require('webpack');
var TestUtils = require('../HappyTestUtils');
var multiline = require('multiline-slash');
var composeWebpackConfig = require('./utils').composeWebpackConfig;

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

    testSuite.getSinonSandbox().stub(console, 'log');
    testSuite.getSinonSandbox().stub(console, 'info');

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
          verbose: true,
          debug: true,
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
    var config = composeWebpackConfig([
      ['*', {
        entry: {
          main: [
            TestUtils.fixturePath('integration/index.js')
          ]
        },

        output: {
          filename: '[name].js',
          path: outputDir
        },

        plugins: [
          new HappyPlugin({
            loaders: [loader._name],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: /.js$/,
        loader: path.resolve(__dirname, '../HappyLoader.js'),
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolveLoaderExtension']
    ])

    var compiler = webpack(config);

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

    var config = composeWebpackConfig([
      ['*', {
        entry: {
          main: [
            TestUtils.fixturePath('integration/index.js')
          ]
        },

        output: {
          filename: '[name].js',
          path: outputDir
        },

        plugins: [
          new HappyPlugin({
            id: 'js',
            loaders: [ loader._name + '?string=HAPPY' ],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: /.js$/,
        loader: path.resolve(__dirname, '../HappyLoader') + '?id=js'
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolveLoaderExtension'],
    ])

    var compiler = webpack(config);

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

    var config = composeWebpackConfig([
      ['*', {
        entry: {
          main: [
            TestUtils.fixturePath('integration/index.js')
          ]
        },

        output: {
          filename: '[name].js',
          path: outputDir
        },

        plugins: [
          new HappyPlugin({
            loaders: [
              { path: loader._name, query: { string: 'HAPPY' } }
            ],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: /.js$/,
        loader: path.resolve(__dirname, '../HappyLoader')
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolveLoaderExtension']
    ])

    var compiler = webpack(config);

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

    var config = composeWebpackConfig([
      ['*', {
        entry: {
          main: TestUtils.fixturePath('integration/index.js')
        },

        output: {
          filename: '[name].js',
          path: outputDir
        },

        plugins: [
          new HappyPlugin({
            loaders: [ loader.path ],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: /\.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH
      }],
    ])

    var compiler = webpack(config);

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