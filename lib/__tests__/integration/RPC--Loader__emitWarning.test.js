var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
var VERSION_1 = require('@happypack/test-utils').VERSION_1;
var VERSION_2 = require('@happypack/test-utils').VERSION_2;
var VERSION_3 = require('@happypack/test-utils').VERSION_3;
const {
  assert,
  createIntegrationSuite,
  composeWebpackConfig,
  multiWebpackAssert
} = TestUtils

describe('[Integration] Loader RPCs - this.emitWarning()', function() {
  var testSuite = createIntegrationSuite(this);
  var withWarning = function(loader) {
    var compiler = webpack(composeWebpackConfig([
      ['entry', testSuite.createFile('src/a.js', '// a.js').path],
      ['output', {
        path: testSuite.createDirectory('dist').path,
      }],

      ['loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH,
        include: [ testSuite.resolve('src') ]
      }],

      ['plugin', [
        new HappyPlugin({
          loaders: [ loader.path ],
          verbose: false,
        })
      ]],

      ['mode', 'development'],
      ['devtool', false],
    ]));

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