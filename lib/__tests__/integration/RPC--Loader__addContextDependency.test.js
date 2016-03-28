'use strict';

const webpack = require('webpack');
const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.addContextDependency()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const loader = TestUtils.createLoader(function(s) {
      this.addContextDependency('b.js');

      return s;
    });

    const sinon = TestUtils.getSinonSandbox();
    TestUtils.spyOnActiveLoader(happyLoader => {
      sinon.spy(happyLoader, 'addContextDependency');
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

      assert.calledWith(TestUtils.activeLoader.addContextDependency, 'b.js')

      done();
    });
  });
});