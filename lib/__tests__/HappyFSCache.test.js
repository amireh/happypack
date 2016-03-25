const Subject = require('../HappyFSCache');
const TestUtils = require('../HappyTestUtils');
const { assert } = require('chai');
const fs = require('fs');

describe("HappyFSCache", function() {
  let subject;

  beforeEach(function() {
    subject = Subject('test', TestUtils.tempPath('cache.json'));
  });

  it('is constructable', function() {
    assert.ok(subject);
  });

  describe('#load', function() {
    context('when the cache file is present', function() {
      let file1, file2, file3;

      beforeEach(function() {
        const mtimes = {};

        file1 = TestUtils.createFile('source_a.js', '');
        file2 = TestUtils.createFile('source_b.js', '');
        file3 = TestUtils.createFile('source_c.js', '');

        mtimes[file1.getPath()] = {
          mtime: fs.statSync(file1.getPath()).mtime.getTime(),
          compiledPath: TestUtils.createFile('source_a.compiled.js', '').getPath(),
          error: null
        };

        mtimes[file2.getPath()] = {
          mtime: -1,
          compiledPath: null,
          error: null
        };

        mtimes[file3.getPath()] = {
          mtime: -1,
          compiledPath: TestUtils.createFile('source_c.compiled.js', '').getPath(),
          error: null
        };

        TestUtils.createFile('cache.json', JSON.stringify({
          context: { loaders: [] },
          mtimes
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
        subject = Subject('test', TestUtils.tempPath('cache.json'));
        subject.load({});

        assert.equal(Object.keys(subject.dump().mtimes).length, 0);
      });

      describe('discarding stale entries', function() {
        it('discards items for which the compiled source no longer exists', function() {
          assert.notInclude(Object.keys(subject.dump().mtimes), file2.getPath());
        });

        it('discards items for which the source had changed since compilation', function() {
          assert.notInclude(Object.keys(subject.dump().mtimes), file3.getPath());
        });
      });
    });

    context('when the cache file is not present', function() {
      it('maintains the current context', function() {
        subject = Subject('test', 'some_non_existing_file.json');
        subject.load({ foo: 'bar' });

        assert.deepEqual(subject.dump().context, { foo: 'bar' });
      });
    });
  });
});
