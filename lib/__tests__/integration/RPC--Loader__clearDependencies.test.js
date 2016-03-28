'use strict';

const webpack = require('webpack');
const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.clearDependencies()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const sinon = TestUtils.getSinonSandbox();
    const loader = TestUtils.createLoader(function(s) {
      this.addDependency(this.resourcePath.replace('a.js', 'b.js'));
      this.addContextDependency(this.resourcePath.replace('a.js', 'c.js'));
      this.clearDependencies();

      return s;
    });

    TestUtils.spyOnActiveLoader(happyLoader => {
      sinon.spy(happyLoader, 'addDependency');
      sinon.spy(happyLoader, 'addContextDependency');
      sinon.spy(happyLoader, 'clearDependencies');
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
        new HappyPlugin({ loaders: [ loader.path ], })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.called(TestUtils.activeLoader.addDependency);
      assert.called(TestUtils.activeLoader.addContextDependency);
      assert.called(TestUtils.activeLoader.clearDependencies);

      done();
    });
  });
});