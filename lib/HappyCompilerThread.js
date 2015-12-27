var path = require('path');
var spawn = require('child_process').spawn;
var assert = require('assert');
var RawStream = require('./RawStream');
var TRANSFORMER_BIN = path.resolve(__dirname, 'HappyTransform.js');
var HappyUtils = require('./HappyUtils');

function HappyCompilerThread(threadId, config, hooks) {
  var fd;
  var queueSz = 0;
  var stream = RawStream(function(messages) {
    if (process.env.VERBOSE) {
      console.log('Thread[%d]: %d files have been compiled.', threadId, messages.length);
    }

    queueSz -= messages.length;

    messages.forEach(function(message) {
      var fragments = stream.deserialize(message);
      var sourcePath = fragments[0];
      var compiledPath = fragments[1];
      var hasFailed = fragments[2] === 'F';

      hooks.onFile(sourcePath, compiledPath, hasFailed);
    });
  });

  function compile(filePaths) {
    assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

    queueSz += filePaths.length;

    filePaths.forEach(function(filePath) {
      var compiledPath = path.resolve(config.tempDir, HappyUtils.generateCompiledPath(filePath));

      fd.stdin.write(stream.serialize([ filePath, compiledPath ]), 'utf-8');
    });
  }

  return {
    open: function() {
      fd = spawn(TRANSFORMER_BIN, [config.transformer], {
        env: {},
        stdio: [ 'pipe', 'pipe', 'inherit' ],
      });

      fd.on('error', hooks.onError);
      fd.stdout.on('data', stream.read);

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now open.', threadId);
      }
    },

    isOpen: function() {
      return !!fd;
    },

    getQueueSize: function() {
      return queueSz;
    },

    close: function() {
      fd.kill('SIGINT');
      fd = null;

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now closed.', threadId);
      }
    },

    compile: compile,
  };
}

module.exports = HappyCompilerThread;
