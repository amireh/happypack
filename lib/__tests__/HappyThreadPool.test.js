'use strict';

const Subject = require("../HappyThreadPool");
const { fixturePath, tempPath } = require('../HappyTestUtils');
const fs = require('fs');

describe.skip("HappyThreadPool", function() {
  it('works', function() {
    Subject({});
  });

  describe('opening and closing threads', function() {
    let subject;

    afterEach(function stopCompiler(done) {
      waitUntil(subject).itStops(done);
      subject.stop();
    });

    it('works', function(done) {
      const loaders = [{ path: fixturePath('identity_loader.js') }];
      const options = {
        loaders,
        compilerOptions: '{}'
      };

      fs.writeFileSync(tempPath('options.json'), JSON.stringify(options), 'utf-8');

      subject = Subject({
        threads: 2,
        loaders,
        optionsPath: tempPath('options.json')
      });

      subject.start(done);
    });
  });
});

function waitUntil(subject) {
  let timeout;

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

  return { itStarts, itStops };
}