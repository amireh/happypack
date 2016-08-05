var Subject = require('../HappyFSCache');
var TestUtils = require('../HappyTestUtils');
var assert = require('chai').assert;
var fs = require('fs');

describe("HappyFSCache", function() {
  var subject;
  var testSuite = TestUtils.IntegrationSuite2(this);

  beforeEach(function() {
    subject = Subject({
      id: 'test',
      path: testSuite.resolve('cache.json')
    });
  });

  it('is varructable', function() {
    assert.ok(subject);
  });

  describe('#load', function() {
    context('when the cache file is present', function() {
      var file1, file2, file3;

      beforeEach(function() {
        var mtimes = {};

        file1 = testSuite.createFile('source_a.js', '');
        file2 = testSuite.createFile('source_b.js', '');
        file3 = testSuite.createFile('source_c.js', '');

        mtimes[file1.path] = {
          mtime: fs.statSync(file1.path).mtime.getTime(),
          compiledPath: testSuite.createFile('source_a.compiled.js', '').path,
          error: null
        };

        mtimes[file2.path] = {
          mtime: -1,
          compiledPath: null,
          error: null
        };

        mtimes[file3.path] = {
          mtime: -1,
          compiledPath: testSuite.createFile('source_c.compiled.js', '').path,
          error: null
        };

        testSuite.createFile('cache.json', JSON.stringify({
          context: { loaders: [] },
          mtimes: mtimes
        }));

        subject.load({ loaders: [] });
      });

      it('loads the entries from it', function() {
        assert.equal(Object.keys(subject.dump().mtimes).length, 1);
      });

      it('loads the context from it', function() {
        assert.deepEqual(subject.dump().context, { loaders: [] });
      });

      it('rejects it if the context differs', function() {
        subject = Subject({
          id: 'test',
          path: testSuite.resolve('cache.json')
        });

        subject.load({});

        assert.equal(Object.keys(subject.dump().mtimes).length, 0);
      });

      describe('discarding stale entries', function() {
        it('discards items for which the compiled source no longer exists', function() {
          assert.notInclude(Object.keys(subject.dump().mtimes), file2.path);
        });

        it('discards items for which the source had changed since compilation', function() {
          assert.notInclude(Object.keys(subject.dump().mtimes), file3.path);
        });
      });
    });

    context('when the cache file is not present', function() {
      it('maintains the current context', function() {
        subject = Subject({
          id: 'test',
          path: 'some_non_existing_file.json'
        });

        subject.load({ foo: 'bar' });

        assert.deepEqual(subject.dump().context, { foo: 'bar' });
      });
    });
  });

  describe('@config.signatureGenerator', function() {
    var generateSignature, file1, file2;

    beforeEach(function() {
      var sandbox = testSuite.getSinonSandbox();
      var mtimes = {};

      generateSignature = sandbox.spy(function() { return '1'; });

      file1 = testSuite.createFile('a.js', '');
      file2 = testSuite.createFile('b.js', '');

      mtimes[file1.path] = {
        mtime: '1',
        compiledPath: testSuite.createFile('a.compiled.js', '').path,
        error: null
      };

      // discard this guy
      mtimes[file2.path] = {
        mtime: null,
        compiledPath: testSuite.createFile('b.compiled.js', '').path,
        error: null
      };

      testSuite.createFile('cache.json', JSON.stringify({
        context: { loaders: [] },
        mtimes: mtimes
      }));

      subject = Subject({
        id: 'test',
        path: testSuite.resolve('cache.json'),
        generateSignature: generateSignature
      });

      subject.load({ loaders: [] });
    });

    it('calls the routine for every file', function() {
      assert.calledWith(generateSignature, file1.path);
      assert.calledWith(generateSignature, file2.path);
    });

    it('keeps files whose signature has not changed', function() {
      assert.include(Object.keys(subject.dump().mtimes), file1.path);
    });

    it('discards files whose signature has changed', function() {
      assert.notInclude(Object.keys(subject.dump().mtimes), file2.path);
    });
  });
});
