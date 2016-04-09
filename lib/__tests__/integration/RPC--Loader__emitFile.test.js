'use strict';

const webpack = require('webpack');
const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.emitFile()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const sinon = TestUtils.getSinonSandbox();
    const loader = TestUtils.createLoader(function(s) {
      this.emitFile('b.js', 'foo', { 1: 'zxc' });

      return s;
    });

    TestUtils.spyOnActiveLoader(happyLoader => {
      sinon.spy(happyLoader, 'emitFile');
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
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.calledWith(TestUtils.activeLoader.emitFile, 'b.js', 'foo', { 1: 'zxc' });

      done();
    });
  });
});