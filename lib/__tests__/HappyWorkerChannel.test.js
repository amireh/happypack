var assert = require('@happypack/test-utils').assert;
var Channel = require('../HappyWorkerChannel');
var HappyTestUtils = require('@happypack/test-utils');
var fixturePath = HappyTestUtils.fixturePath;

function testHappyWorkerChannel(config) {
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

    Channel('c1', fd.remote, config);

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
}

describe('HappyWorkerChannel', function() {
  testHappyWorkerChannel({})
});

describe('HappyWorkerChannel [buffered]', function() {
  testHappyWorkerChannel({ buffered: true })
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

      send: function(payload, x, y, callback) {
        messages.push(payload);

        localCallbacks.forEach(function(f) { f(payload); });

        if (callback) {
          callback()
        }
      }
    },

    local: {
      on: function(_event, callback) {
        localCallbacks.push(callback);
      },

      send: function(message, x, y, callback) {
        remoteCallbacks.forEach(function(f) { f(message); });
        if (callback) {
          callback()
        }
      }
    }
  };
}
