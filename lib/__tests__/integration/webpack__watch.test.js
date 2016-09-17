var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var assert = require('chai').assert;

describe('[Integration] webpack --watch', function() {
  var testSuite = TestUtils.IntegrationSuite2(this, {
    timeout: 10000
  });

  it('works', function(done) {
    var outputDir = testSuite.createDirectory('dist').path;

    var loader = testSuite.createLoader(function(s) {
      var callback = this.async();

      this.addDependency(this.resource.replace('.js', '.tmp.js'));
      this.resolve(this.context, './b.js', function() {
        callback(null, s + '\n// HAPPY!');
      });
    });

    var file1 = testSuite.createFile('src/a.js', "require('./b.js');");
    var file2 = testSuite.createFile('src/b.js', '');

    var compiler = webpack({
      entry: file1.path,

      watch: true,
      watchOptions: {
        aggregateTimeout: 250
      },

      output: {
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
          verbose: false,
          loaders: [loader.path]
        })
      ]
    });

    var runCount = 0;
    var watcher, timeout;

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
      if (timeout) {
        timeout = clearTimeout(timeout);
      }

      if (err) {
        return closeAndEmitDone(err);
      }

      var stats = rawStats.toJson();

      if (stats.errors.length > 0) {
        return done(stats.errors);
      }

      assert.match(fs.readFileSync(path.join(outputDir, 'bundle.js'), 'utf-8'), '// HAPPY');

      if (process.env.DEBUG) {
        process.stdout.write(rawStats.toString({}) + "\n");
      }

      if (++runCount >= 3) {
        closeAndEmitDone();
      }
      else {
        timeout = setTimeout(function() {
          fs.appendFileSync(file2.path, '\nconsole.log("foo");', 'utf-8');
        }, 350);
      }
    });
  });
});