var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
const {
  assert,
  composeWebpackConfig
} = TestUtils

describe('[Integration] Compiler RPCs - stats', function () {
  context('provides error to webpack stats when a loader throws a error as string', function () {
    var testSuite = TestUtils.createIntegrationSuite(this);

    it('works', function (done) {
      var loader = testSuite.createLoader(function () {
        throw 'Unexpected token...';
      });

      var compiler = webpack(composeWebpackConfig([
        ['entry', testSuite.createFile('a.js', '// a.js').path],
        ['output', {
          path: testSuite.createDirectory('dist').path,
        }],

        ['loader', {
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }],

        ['plugin', [
          new HappyPlugin({
            loaders: [loader.path],
            verbose: false,
          })
        ]]
      ]));

      compiler.run(function (err, rawStats) {
        if (err) return done(err);

        var errors = rawStats.compilation.errors;

        assert.equal(errors.length, 1);
        var error = errors[0];

        assert.instanceOf(error, Error);
        // webpack does not support errors as strings, so there's nothing to assert here
        // see https://github.com/webpack/webpack/blob/d0908fe40de9f6335daae767aa47b25ec700a766/lib/ModuleBuildError.js#L15
        done();
      });
    });
  });

  context('provides full error details to webpack stats when a loader throws a error', function () {
    var testSuite = TestUtils.createIntegrationSuite(this);

    it('works', function (done) {
      var loader = testSuite.createLoader(function () {
        var error = new Error('Unexpected token...');
        error.file = 'test.js';

        throw error;
      });

      var compiler = webpack(composeWebpackConfig([
        ['entry', testSuite.createFile('a.js', '// a.js').path],
        ['output', {
          path: testSuite.createDirectory('dist').path,
        }],

        ['loader', {
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }],

        ['plugin', [
          new HappyPlugin({
            loaders: [loader.path],
            verbose: false,
          })
        ]]
      ]));

      compiler.run(function (err, rawStats) {
        if (err) return done(err);

        var errors = rawStats.compilation.errors;

        assert.equal(errors.length, 1);
        var error = errors[0];

        assert.instanceOf(error, Error);
        assert.propertyVal(error, 'name', 'ModuleBuildError');

        assert.propertyVal(error.error, 'message', 'Unexpected token...');
        assert.propertyVal(error.error, 'file', 'test.js');
        done();
      });
    });
  });

  context('provides error to webpack stats when a async loader throws a error as string', function () {
    var testSuite = TestUtils.createIntegrationSuite(this);

    it('works', function (done) {
      var loader = testSuite.createLoader(function () {

        var callback = this.async();

        setTimeout(function () {
          callback('Unexpected token...');
        }, 0);
      });

      var compiler = webpack(composeWebpackConfig([
        ['entry', testSuite.createFile('a.js', '// a.js').path],
        ['output', {
          path: testSuite.createDirectory('dist').path,
        }],

        ['loader', {
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }],

        ['plugin', [
          new HappyPlugin({
            loaders: [loader.path],
            verbose: false,
          })
        ]]
      ]));

      compiler.run(function (err, rawStats) {
        if (err) return done(err);

        var errors = rawStats.compilation.errors;

        assert.equal(errors.length, 1);
        var error = errors[0];

        assert.instanceOf(error, Error);
        // webpack does not support errors as strings, so there's nothing to assert here
        // see https://github.com/webpack/webpack/blob/d0908fe40de9f6335daae767aa47b25ec700a766/lib/ModuleBuildError.js#L15
        done();
      });
    });
  });

  context('provides full error details to webpack stats when a async loader produces an error', function () {
    var testSuite = TestUtils.createIntegrationSuite(this);

    it('works', function (done) {
      var loader = testSuite.createLoader(function () {
        var error = new Error('Unexpected token...');
        error.file = 'test.js';

        var callback = this.async();

        setTimeout(function () {
          callback(error);
        }, 0);
      });

      var compiler = webpack(composeWebpackConfig([
        ['entry', testSuite.createFile('a.js', '// a.js').path],
        ['output', {
          path: testSuite.createDirectory('dist').path,
        }],

        ['loader', {
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }],

        ['plugin', [
          new HappyPlugin({
            loaders: [loader.path],
            verbose: false,
          })
        ]]
      ]));

      compiler.run(function (err, rawStats) {
        if (err) return done(err);

        var errors = rawStats.compilation.errors;

        assert.equal(errors.length, 1);
        var error = errors[0];

        assert.instanceOf(error, Error);
        assert.propertyVal(error, 'name', 'ModuleBuildError');
        assert.propertyVal(error.error, 'message', 'Unexpected token...');
        assert.propertyVal(error.error, 'file', 'test.js');
        done();
      });
    });
  });
});