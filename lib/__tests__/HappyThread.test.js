var fs = require('fs');
var Subject = require("../HappyThread");
var HappyTestUtils = require('../HappyTestUtils');
var assert = HappyTestUtils.assert;

describe("HappyThread", function() {
  var testSuite = HappyTestUtils.IntegrationSuite2(this);
  var subject, inputFile;

  beforeEach(function() {
    inputFile = testSuite.createFile('a.js', 'he');
  });

  afterEach(function() {
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

      subject.configure('default', JSON.stringify({ foo: 'bar' }), function(configureError) {
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

      subject.configure('default', "{}", function() {
        subject.compile({
          loaders: [testSuite.createLoader(function(s) { return s + 'he'; })],
          compiledPath: testSuite.resolve('a.out'),
          loaderContext: {
            compilerId: 'default',
            request: inputFile.path,
            resourcePath: inputFile.path,
            sourceCode: inputFile.contents,
          }
        }, function(result) {
          assert.equal(result.error, undefined);
          assert.equal(fs.readFileSync(testSuite.resolve('a.out'), 'utf-8'), 'hehe');

          done();
        });
      });

    });
  });
});