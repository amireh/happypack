var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var HappyUtils = require('./HappyUtils');
var EventEmitter = require('events');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorker.js');

function HappyThread(threadId, config) {
  var fd;
  var callbacks = new EventEmitter();

  return {
    open: function(onReady) {
      var readyCalled = false;
      var emitReady = function() {
        readyCalled = true;

        if (onReady) {
          onReady.apply(null, arguments);
        }
      };

      fd = fork(WORKER_BIN, [config.optionsPath]);

      fd.on('error', throwError);
      fd.on('exit', function(exitCode) {
        if (exitCode !== 0 && !readyCalled) {
          emitReady('HappyPack: worker exited abnormally with code ' + exitCode);
        }
      });

      fd.on('message', function(message) {
        if (message.id === 'ready') {
          emitReady();
        }
        else if (message.id === 'compiled') {
          var filePath = message.sourcePath;

          if (process.env.VERBOSE) {
            console.log('Thread[%d]: a file has been compiled.', threadId, filePath);
          }

          assert(callbacks.listeners(filePath).length > 0,
            "HappyThread: expected loader to be pending on source file '" +
            filePath + "'" + " (this is likely an internal error!)"
          );

          callbacks.emit(filePath, message);
        }
      });

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now open.', threadId);
      }
    },

    compile: compile,

    isOpen: function() {
      return !!fd;
    },

    close: function() {
      fd.kill('SIGINT');
      fd = null;

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now closed.', threadId);
      }
    },
  };

  function compile(filePath, done) {
    assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

    callbacks.on(filePath, done);

    fd.send({
      id: 'compile',
      sourcePath: filePath,
      compiledPath: path.resolve(config.tempDir, HappyUtils.generateCompiledPath(filePath))
    });
  }
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}
