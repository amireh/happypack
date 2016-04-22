'use strict';

const Subject = require("../HappyThread");
const { assert, createFile, createLoader, tempPath } = require('../HappyTestUtils');
const sinon = require('sinon');
const fs = require('fs');

describe("HappyThread", function() {
  const sandbox = sinon.sandbox.create();

  let subject, inputFile;

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

  it('notifies me when a compilation is complete', function(done) {
    subject = Subject('t1');

    subject.open(function(openError) {
      if (openError) return done(openError);

      subject.configure("{}", function() {
        subject.compile({
          loaders: [createLoader(s => s + 'he')],
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