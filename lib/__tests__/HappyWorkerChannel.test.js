var fs = require('fs');
var assert = require('chai').assert;
var Channel = require('../HappyWorkerChannel');
var sinon = require('sinon');
var HappyTestUtils = require('../HappyTestUtils');
var fixture = HappyTestUtils.fixture;
var tempPath = HappyTestUtils.tempPath;
var fixturePath = HappyTestUtils.fixturePath;

describe('HappyWorkerChannel', function() {
  var sandbox = sinon.sandbox.create();
  var loaders = [{ path: fixturePath('identity_loader.js') }];
  var sourceCode = "var x = 'foo';";
  var sourceMap = {};

  var fd;

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
        loaders: loaders,
        compiledPath: tempPath('a.out'),
        loaderContext: {
          request: fixturePath('a.js'),
          resourcePath: fixturePath('a.js'),
          sourceCode: sourceCode,
          sourceMap: sourceMap,
        }
      }
    });
  });

  it('stores the compiled source at the specified path', function(done) {
    fd.local.on('message', function() {
      var contents = fs.readFileSync(tempPath('a.out'), 'utf-8');

      assert.equal(contents, fixture('a.js'));

      done();
    });

    fd.local.send({
      name: 'COMPILE',
      data: {
        loaders: loaders,
        compiledPath: tempPath('a.out'),
        loaderContext: {
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
