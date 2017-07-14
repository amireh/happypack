var assert = require('happypack-test-utils').assert;
var Channel = require('../HappyWorkerChannel');
var HappyTestUtils = require('happypack-test-utils');
var fixturePath = HappyTestUtils.fixturePath;

describe('HappyWorkerChannel', function() {
  var loaders = [{ path: fixturePath('identity_loader.js') }];
  var fd, sourceCode, sourceMap;

  beforeEach(function(done) {
    sourceCode = "var x = 'foo';";
    sourceMap = {};

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
        compilerId: 'default',
        compilerOptions: '{}'
      }
    });
  });

  afterEach(function() {
    fd = null;
  });

  it('accepts compilation requests', function(done) {
    fd.local.on('message', function(message) {
      assert.equal(message.name, 'COMPILED');
      assert.include(Object.keys(message.data), 'compiledSource')
      assert.include(Object.keys(message.data), 'compiledMap')

      done();
    });

    fd.local.send({
      name: 'COMPILE',
      data: {
        loaders: loaders,
        // compiledPath: testSuite.resolve('a.out'),
        loaderContext: {
          compilerId: 'default',
          request: fixturePath('a.js'),
          resourcePath: fixturePath('a.js'),
          sourceCode: sourceCode,
          sourceMap: sourceMap,
        }
      }
    });
  });
});

function FakeProcess() {
  var remoteCallbacks = [];
  var localCallbacks = [];
  var messages = [];

  return {
    messages: messages,

    remote: {
      on: function(_event, callback) {
        remoteCallbacks.push(callback);
      },

      send: function(payload) {
        messages.push(payload);

        localCallbacks.forEach(function(f) { f(payload); });
      }
    },

    local: {
      on: function(_event, callback) {
        localCallbacks.push(callback);
      },

      send: function(message) {
        remoteCallbacks.forEach(function(f) { f(message); });
      }
    }
  };
}
