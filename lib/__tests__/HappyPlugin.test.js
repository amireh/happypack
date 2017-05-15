var sinon = require('sinon');

var Subject = require('../HappyPlugin');
var HappyTestUtils = require('../HappyTestUtils');
var assert = HappyTestUtils.assert;

describe('HappyPlugin', function() {
  var testSuite = HappyTestUtils.IntegrationSuite2(this);

  it('works', function() {
    Subject({
      loaders: [testSuite.createLoader(function(s) { return s + '123'; })]
    });
  });

  it('bails if there are no loaders', function() {
    assert.throws(function() {
      Subject({ loaders: [] })
    }, 'You must specify at least one loader!');
  });

  it('bails if an invalid loader array is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: 'babel' })
    }, 'Loaders must be an array!');
  });

  it('bails if an invalid loader is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: [ function() {} ] })
    }, 'Loader must have a @path or @loader property or be a string.');
  });

  it('accepts a loader as a string', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ 'babel' ] })
    });
  });

  it('accepts a loader object with path specified in @path', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ { path: 'babel' } ] })
    });
  })

  it('accepts a loader object with path specified in @loader', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ { loader: 'babel' } ] })
    });
  })

  describe('#compile', function() {
    it('avoids preserving stale cache on simultaneous file edit', function() {
      // Create a file with a corresponding mtime.
      var sourceFile = testSuite.createFile('src-file.coffee', 'abc = "123"');
      var mtime = 0;
      var signatureGenerator = function(filePath) {
        return (filePath === sourceFile.path) ? mtime : 0;
      }

      // Use a fake compiler just so we can instantiate a plugin with a cache and threadPool.
      var compiler = {plugin: sinon.spy(), options: {}};
      var loader = testSuite.createLoader(function(s) { return s; });
      var plugin = Subject({
        loaders: [loader],
        cacheSignatureGenerator: signatureGenerator,
      });
      plugin.apply(compiler);

      // We don't care about testing the actual compile, so we'll stub it out.
      var sandbox = testSuite.getSinonSandbox();
      var threadCompileStub = sandbox.stub(plugin.threadPool, 'compile');

      plugin.compile(loader, {resourcePath: sourceFile.path}, function() {});
      assert(threadCompileStub.calledOnce);

      // SIMULATE that the file has changed after reading the source but before writing to the cache.
      // If the mtime is read for the first time too late, then the cache will think that the source file
      // is up-to-date even though is it now out-of-date.
      mtime++;

      // "Compile" the file and call the callback to trigger the cache behavior.
      var compiledFile = testSuite.createFile('build/src-file.js', 'var abc = "123";');
      testSuite.createFile('build/src-file.js.map', 'abc source map');
      threadCompileStub.getCall(0).args[3]({
        success: true,
        compiledPath: compiledFile.path,
      });

      // If we used the mtime of 0 when cacheing, then the file will correctly be identified as stale:
      assert(plugin.cache.hasChanged(sourceFile.path));
    });
  });
});
