'use strict';

const webpack = require('webpack');
const fs = require('fs');
const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.clearDependencies()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const loader = TestUtils.createLoader(function(s) {
      this.addDependency(this.resourcePath.replace('a.js', 'b.js'));
      this.addContextDependency(this.resourcePath.replace('a.js', 'c.js'));
      this.clearDependencies();

      return s;
    });

    const indexFile = TestUtils.createFile('integration/RPC--Loader__clearDependencies/a.js', '// a.js');

    TestUtils.createFile('integration/RPC--Loader__clearDependencies/b.js', '// b.js');
    TestUtils.createFile('integration/RPC--Loader__clearDependencies/c.js', '// c.js');

    const compiler = webpack({
      entry: indexFile.getPath(),
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

      if (stats.errors.length) { return done(stats.errors); }
      else if (stats.warnings.length) { return done(stats.warnings); }

      const contents = fs.readFileSync(TestUtils.getWebpackOutputBundlePath(rawStats), 'utf-8');

      assert.match(contents, '// a.js');

      done();
    });
  });
});