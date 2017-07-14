var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;
var multiWebpackAssert = require('../utils/multiWebpackAssert');
var VERSION_1 = require('../utils').VERSION_1;
var VERSION_2 = require('../utils').VERSION_2;
var VERSION_3 = require('../utils').VERSION_3;

describe('[Integration] Loader RPCs - this.emitWarning()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);
  var withWarning = function(loader) {
    var compiler = webpack({
      entry: testSuite.createFile('src/a.js', '// a.js').path,
      output: {
        path: testSuite.createDirectory('dist').path,
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH,
          include: [ testSuite.resolve('src') ]
        }]
      },

      plugins: [
        new HappyPlugin({
          loaders: [ loader.path ],
          verbose: false,
        })
      ]
    });

    return function(f) {
      compiler.run(f);
    }
  }

  it('works', function(done) {
    var loader = testSuite.createLoader(function(s) {
      this.emitWarning('this is a warning');

      return s;
    });

    withWarning(loader)(function(err, rawStats) {
      if (err) return done(err);

      var stats = rawStats.toJson();

      assert.equal(stats.warnings.length, 1);
      assert.match(stats.warnings[0], 'this is a warning');

      done();
    });
  });

  it('passes Error objects through', function(done) {
    var loader = testSuite.createLoader(function(s) {
      this.emitWarning(new Error('this is a warning'));

      return s;
    });

    withWarning(loader)(function(err, rawStats) {
      if (err) return done(err);

      var stats = rawStats.toJson();

      assert.equal(stats.warnings.length, 1);

      multiWebpackAssert([
        [ VERSION_1, function() {
          assert.equal(typeof stats.warnings[0], 'string');
        }],

        [ [ VERSION_2, VERSION_3 ], function() {
          assert.equal(rawStats.compilation.warnings.length, 1)
          assert.ok(rawStats.compilation.warnings[0] instanceof Error)
          assert.equal(rawStats.compilation.warnings[0].constructor.name, 'ModuleWarning')
        }]
      ])

      assert.include(stats.warnings[0].toString(), 'this is a warning');

      done();
    });
  });
});