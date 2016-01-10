const Subject = require("../HappyThread");
const { assert, createFile, createLoader } = require('../HappyTestUtils');
const sinon = require('sinon');
const fs = require('fs');

describe("HappyThread", function() {
  let subject;
  let optionsFile, inputFile;

  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    optionsFile = createFile('happy-options.json', JSON.stringify({
      loaders: [createLoader(s => s + 'he')],
      compilerOptions: {}
    }));

    inputFile = createFile('a.js', 'he');
  });

  afterEach(function() {
    sandbox.restore();

    if (subject && subject.isOpen()) {
      subject.close();
    }
  });

  it('works', function(done) {
    subject = Subject('t1', {
      tempDir: '/tmp',
      optionsPath: optionsFile.getPath()
    });

    subject.open(function(err) {
      assert.ok(subject.isOpen());

      done(err);
    });
  });

  it('notifies me when a compilation is complete', function(done) {
    subject = Subject('t1', {
      tempDir: '/tmp',
      optionsPath: optionsFile.getPath()
    });

    subject.open(function(openError) {
      if (openError) return done(openError);

      subject.compile(inputFile.getPath(), {}, function(result) {
        assert.equal(result.error, undefined);
        assert.equal(fs.readFileSync(result.compiledPath, 'utf-8'), 'hehe');

        done();
      });
    });
  });
});