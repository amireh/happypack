'use strict';

const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const webpack = require('webpack');
const path = require('path');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.emitError()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const loader = TestUtils.createLoader(function(s) {
      this.emitError('this is an error');

      return s;
    });

    const compiler = webpack({
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

      const stats = rawStats.toJson();

      assert.equal(stats.errors.length, 1);
      assert.match(stats.errors[0], 'this is an error');

      done();
    });
  });
});