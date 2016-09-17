var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.emitError()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var loader = testSuite.createLoader(function(s) {
      this.emitError('this is an error');

      return s;
    });

    var compiler = webpack({
      entry: testSuite.createFile('a.js', '// a.js').path,
      output: {
        path: testSuite.createDirectory('dist').path,
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
          verbose: false,
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (err) return done(err);

      var stats = rawStats.toJson();

      assert.equal(stats.errors.length, 1);
      assert.match(stats.errors[0], 'this is an error');

      done();
    });
  });
});