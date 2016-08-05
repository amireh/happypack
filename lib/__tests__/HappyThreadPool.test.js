var Subject = require("../HappyThreadPool");
var assert = require('chai').assert;

describe("HappyThreadPool", function() {
  it('works', function() {
    Subject({ size: 2 });
  });

  describe('opening and closing threads', function() {
    var subject;

    afterEach(function stopCompiler(done) {
      waitUntil(subject).itStops(done);
      subject.stop();
    });

    it('works', function(done) {
      subject = Subject({
        size: 2,
      });

      subject.start(function(e) {
        assert.ok(subject.isRunning());

        done(e);
      });
    });
  });
});

function waitUntil(subject) {
  var timeout;

  function itStarts(done) {
    if (subject.isRunning()) {
      timeout = clearTimeout(timeout);
      done();
    }
    else {
      timeout = setTimeout(itStarts.bind(null, done), 1);
    }
  }

  function itStops(done) {
    if (!subject.isRunning()) {
      timeout = clearTimeout(timeout);
      done();
    }
    else {
      timeout = setTimeout(itStops.bind(null, done), 1);
    }
  }

  return { itStarts: itStarts, itStops: itStops };
}