'use strict';

const Channel = require('../HappyWorkerChannel');
const fs = require('fs');
const { assert } = require('chai');
const sinon = require('sinon');
const { fixture, tempPath, fixturePath } = require('../HappyTestUtils');

describe('HappyWorkerChannel', function() {
  const sandbox = sinon.sandbox.create();
  const loaders = [{ path: fixturePath('identity_loader.js') }];
  const sourceCode = `var x = 'foo';`;
  const sourceMap = {};

  let fd;

  beforeEach(function(done) {
    fd = FakeProcess();
    fd.local.on('message', function(message) {
      if (message.name === 'CONFIGURE_DONE') {
        done();
      }
    });

    Channel('c1', fd.remote);

    fd.local.send({
      name: 'CONFIGURE',
      data: {
        compilerOptions: '{}'
      }
    });
  });

  afterEach(function() {
    sandbox.restore();
    fd = null;
  });

  it('accepts compilation requests', function(done) {
    fd.local.on('message', function(message) {
      assert.equal(message.name, 'COMPILED');
      assert.equal(message.sourcePath, fixturePath('a.js'));
      assert.equal(message.compiledPath, tempPath('a.out'));
      assert.equal(message.success, true);

      done();
    });

    fd.local.send({
      name: 'COMPILE',
      data: {
        loaders,
        compiledPath: tempPath('a.out'),
        loaderContext: {
          request: fixturePath('a.js'),
          resourcePath: fixturePath('a.js'),
          sourceCode,
          sourceMap,
        }
      }
    });
  });

  it('stores the compiled source at the specified path', function(done) {
    fd.local.on('message', function() {
      const contents = fs.readFileSync(tempPath('a.out'), 'utf-8');

      assert.equal(contents, fixture('a.js'));

      done();
    });

    fd.local.send({
      name: 'COMPILE',
      data: {
        loaders,
        compiledPath: tempPath('a.out'),
        loaderContext: {
          request: fixturePath('a.js'),
          resourcePath: fixturePath('a.js'),
          sourceCode,
          sourceMap,
        }
      }
    });
  });
});

function FakeProcess() {
  const remoteCallbacks = [];
  const localCallbacks = [];
  const messages = [];

  return {
    messages,

    remote: {
      on(_event, callback) {
        remoteCallbacks.push(callback);
      },

      send(payload) {
        messages.push(payload);

        localCallbacks.forEach(f => f(payload));
      }
    },

    local: {
      on(_event, callback) {
        localCallbacks.push(callback);
      },

      send(message) {
        remoteCallbacks.forEach(f => f(message));
      }
    }
  };
}
