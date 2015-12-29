const Subject = require('../HappyWorker');
const fs = require('fs');
const { assert } = require('chai');
const sinon = require('sinon');
const { fixture, tempPath, fixturePath } = require('../HappyTestUtils');

describe('HappyWorker', function() {
  const sandbox = sinon.sandbox.create();
  const loaders = [{ path: fixturePath('identity_loader.js') }];

  let fd;

  beforeEach(function() {
    fd = MemoryDescriptor();
    Subject(fd.remote, { loaders, compilerOptions: {} });
  });

  afterEach(function() {
    sandbox.restore();
    fd = null;
  });

  it('accepts messages on stdin', function(done) {
    fd.local.on('data', function(message) {
      assert.equal(message.length, 3);
      assert.equal(message[0], fixturePath('a.js'));
      assert.equal(message[1], tempPath('a.out'));
      assert.equal(message[2], 'S');

      done();
    });

    fd.local.write([{ sp: fixturePath('a.js'), cp: tempPath('a.out') }]);
  });

  it('stores the resulting source at the specified path', function(done) {
    fd.local.on('data', function() {
      const contents = fs.readFileSync(tempPath('a.out'), 'utf-8');

      assert.equal(contents, fixture('a.js'));

      done();
    });

    fd.local.write([{ sp: fixturePath('a.js'), cp: tempPath('a.out') }]);
  });
});

function MemoryDescriptor() {
  const remoteCallbacks = [];
  const localCallbacks = [];
  const messages = [];

  return {
    messages,

    remote: {
      accept() {},

      on(_event, callback) {
        remoteCallbacks.push(callback);
      },

      write(payload) {
        messages.push(payload);

        localCallbacks.forEach(f => f(payload));
      }
    },

    local: {
      on(_event, callback) {
        localCallbacks.push(callback);
      },

      write(message) {
        remoteCallbacks.forEach(f => f(message));
      }
    }
  };
}
