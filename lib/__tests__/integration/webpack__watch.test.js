'use strict';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] webpack --watch', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const outputDir = TestUtils.tempDir('integration-[guid]');

    const loader = TestUtils.createLoader(function(s) {
      this.addDependency(this.resource.replace('.js', '.tmp.js'));

      return s + '\n// HAPPY!';
    });

    const file1 = TestUtils.createFile('a.js', "require('./b.js');");
    const file2 = TestUtils.createFile('b.js', '');

    const compiler = webpack({
      entry: {
        main: file1.getPath()
      },

      watch: true,

      output: {
        filename: '[name].js',
        path: outputDir
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      plugins: [
        new HappyPlugin({
          cache: false,
          loaders: [loader.path]
        })
      ]
    });

    let runCount = 0;
    let watcher;

    const closeAndEmitDone = (err) => {
      try {
        watcher.close();
      }
      catch(e) {
        console.warn('unable to stop watcher:', e);
      }
      finally {
        done(err);
      }
    };

    watcher = compiler.watch({}, function(err, rawStats) {
      if (err) {
        return closeAndEmitDone(err);
      }

      const stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'main.js'), 'utf-8'), '// HAPPY');

      process.stdout.write(rawStats.toString({}) + "\n");

      if (++runCount === 3) {
        watcher.close(function() {
          done();
        });
      }
      else {
        setTimeout(function() {
          fs.appendFileSync(file2.getPath(), '\nconsole.log("foo");', 'utf-8');
        }, 250);
      }
    });
  });
});