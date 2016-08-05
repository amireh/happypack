var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var assert = require('chai').assert;

describe('[Integration] webpack --watch', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var outputDir = TestUtils.tempDir('integration-[guid]');

    var loader = TestUtils.createLoader(function(s) {
      this.addDependency(this.resource.replace('.js', '.tmp.js'));

      return s + '\n// HAPPY!';
    });

    var file1 = TestUtils.createFile('a.js', "require('./b.js');");
    var file2 = TestUtils.createFile('b.js', '');

    var compiler = webpack({
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

    var runCount = 0;
    var watcher;

    var closeAndEmitDone = function (err) {
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

      var stats = rawStats.toJson();

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