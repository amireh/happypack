'use strict';

const { assert } = require('chai');
const TestUtils = require('../../HappyTestUtils');
const HappyPlugin = require('../../HappyPlugin');
const webpack = require('webpack');

describe('[Integration] config - @threadPool', function() {

  context('when a custom thread pool is passed', function() {
    const threadPool = HappyPlugin.ThreadPool({ size: 3, });

    beforeEach(function(done) {
      const sinon = TestUtils.getSinonSandbox();

      HappyPlugin.resetUID();

      sinon.spy(threadPool, 'start');
      sinon.spy(threadPool, 'get');
      sinon.spy(threadPool, 'stop');

      const outputDir = TestUtils.tempDir('integration-[guid]');
      const loader = TestUtils.createLoader(s => s);

      const file1 = TestUtils.createFile('a.js', "require('./b.jsx')");
      const file2 = TestUtils.createFile('b.jsx', "console.log('hello!');");

      const compiler = webpack({
        entry: {
          main: [
            file1.getPath(),
            file2.getPath()
          ]
        },

        output: {
          filename: '[name].js',
          path: outputDir
        },

        module: {
          loaders: [{
            test: /.js$/,
            loader: TestUtils.HAPPY_LOADER_PATH
          }, {
            test: /.jsx$/,
            loader: TestUtils.HAPPY_LOADER_PATH + '?id=jsx'
          }]
        },

        plugins: [
          new HappyPlugin({
            cache: false,
            loaders: [ loader.path ],
            threadPool
          }),

          new HappyPlugin({
            id: 'jsx',
            cache: false,
            loaders: [ loader.path ],
            threadPool
          })
        ]
      });

      compiler.run(function(err, rawStats) {
        if (TestUtils.assertNoWebpackErrors(err, rawStats, done)) {
          return;
        }

        done();
      });
    });

    afterEach(function() {
      assert(!threadPool.isRunning());
    })

    it('waits until the pool is started', function() {
      assert.calledTwice(threadPool.start);
    });

    it('uses it', function() {
      assert.calledTwice(threadPool.get);
    });

    it('stops the pool when it is done', function() {
      assert.calledTwice(threadPool.stop);
    });
  });
});