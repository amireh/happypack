var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.emitWarning()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var loader = TestUtils.createLoader(function(s) {
      this.emitWarning('this is a warning');

      return s;
    });

    var compiler = webpack({
      entry: TestUtils.createFile('a.js', '// a.js').getPath(),
      output: {
        path: TestUtils.tempDir('integration-[guid]')
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
      if (err) return done(err);

      var stats = rawStats.toJson();

      assert.equal(stats.warnings.length, 1);
      assert.match(stats.warnings[0], 'this is a warning');

      done();
    });
  });
});