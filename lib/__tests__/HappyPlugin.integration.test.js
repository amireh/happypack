var HappyPlugin = require('../HappyPlugin');
var path = require('path');
var fs = require('fs');
var assert = require('@happypack/test-utils').assert;
var webpack = require('webpack');
var TestUtils = require('@happypack/test-utils');
var multiline = require('multiline-slash');
var composeWebpackConfig = require('@happypack/test-utils').composeWebpackConfig;

describe('[Integration] HappyPlugin', function() {
  var testSuite = TestUtils.createIntegrationSuite(this);

  function testCompilation(config, done) {
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

    var compiler = webpack(composeWebpackConfig([
      ['entry', {
        main: [
          file1.path,
          file3.path,
        ]
      }],

      ['loader', {
        test: /.js$/,
        loader: path.resolve(__dirname, '../HappyLoader.js')
      }],

      ['plugin', new HappyPlugin(Object.assign({}, config, {
        loaders: [loader.path, identityLoader.path]
      }))],

      ['output', {
        filename: '[name].js',
        path: outputDir
      }],

      ['mode', 'development'],
      ['devtool', false],
    ]));

    compiler.run(function(err, rawStats) {
      if (err) { return done(err); }

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      done();
    });
  }

  it('compiles my files', function(done) {
    testCompilation({
      verbose: true,
      debug: true,
    }, done)
  });

  it('compiles my files [buffered]', function(done) {
    testCompilation({
      bufferedMessaging: true,
      verbose: true,
      debug: true,
    }, done)
  });

  it("resolves my loaders using webpack's loader resolver", function(done) {
    var outputDir = testSuite.createDirectory('dist').path;
    var loader = testSuite.createLoader(function(s) { return s + '\n// HAPPY!'; });
    var config = composeWebpackConfig([
      ['*', {

        plugins: [
          new HappyPlugin({
            loaders: [loader._name],
            verbose: false,
          })
        ]
      }],

      ['entry', {
        main: [
          TestUtils.fixturePath('integration/index.js')
        ]
      }],

      ['output', {
        filename: '[name].js',
        path: outputDir
      }],

      ['loader', {
        test: /.js$/,
        loader: path.resolve(__dirname, '../HappyLoader.js'),
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolveLoaderExtension'],
      ['mode', 'development']
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

      ['mode', 'development'],
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

      ['resolveLoaderExtension'],
      ['mode', 'development'],
      ['devtool', false],
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

      ['mode', 'development'],
      ['devtool', false],
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