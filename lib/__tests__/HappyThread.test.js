var fs = require('fs');
var sinon = require('sinon');
var Subject = require("../HappyThread");
var HappyTestUtils = require('../HappyTestUtils');
var assert = HappyTestUtils.assert;
var createLoader = HappyTestUtils.createLoader;
var createFile = HappyTestUtils.createFile;
var tempPath = HappyTestUtils.tempPath;

describe("HappyThread", function() {
  var sandbox = sinon.sandbox.create();
  var subject, inputFile;

  beforeEach(function() {
    inputFile = createFile('a.js', 'he');
  });

  afterEach(function() {
    sandbox.restore();

    if (subject && subject.isOpen()) {
      subject.close();
    }
  });

  it('works', function(done) {
    subject = Subject('t1');
    subject.open(function(err) {
      assert.ok(subject.isOpen());

      done(err);
    });
  });

  it('is configurable', function(done) {
    subject = Subject('t1');
    subject.open(function(err) {
      if (err) { return done(err); }

      subject.configure(JSON.stringify({ foo: 'bar' }), function(configureError) {
        if (configureError) {
          return done(configureError);
        }

        done();
      });
    });
  });

  it('notifies me when a compilation is compvare', function(done) {
    subject = Subject('t1');

    subject.open(function(openError) {
      if (openError) return done(openError);

      subject.configure("{}", function() {
        subject.compile({
          loaders: [createLoader(function(s) { return s + 'he'; })],
          compiledPath: tempPath('a.out'),
          loaderContext: {
            request: inputFile.getPath(),
            resourcePath: inputFile.getPath(),
            sourceCode: inputFile.getContents(),
          }
        }, function(result) {
          assert.equal(result.error, undefined);
          assert.equal(fs.readFileSync(tempPath('a.out'), 'utf-8'), 'hehe');

          done();
        });
      });

    });
  });
});