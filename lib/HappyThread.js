var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var HappyUtils = require('./HappyUtils');
var events = require('events');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorker.js');
var EventEmitter = events.EventEmitter || events;

function HappyThread(threadId, config, onCompilerRequest) {
  var fd;
  var callbacks = new EventEmitter();

  return {
    open: function(onReady) {
      var emitReady = Once(onReady);

      fd = fork(WORKER_BIN, [threadId, config.optionsPath]);

      fd.on('error', throwError);
      fd.on('exit', function(exitCode) {
        if (exitCode !== 0) {
          emitReady('HappyPack: worker exited abnormally with code ' + exitCode);
        }
      });

      fd.on('message', function(message) {
        if (message.type === 'compiled') {
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
        else if (message.type === 'ready') {
          if (process.env.VERBOSE) {
            console.log('Happy thread[%d] is now open.', threadId);
          }

          emitReady();
        }
        else if (message._compilerRequest) {
          onCompilerRequest(message.type, message.payload, function(error, result) {
            fd.send({
              id: message.id,
              payload: {
                error: error,
                result: result
              }
            });
          });
        }
      });
    },

    compile: compile,
    on: callbacks.on.bind(callbacks),

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

  function compile(filePath, loaderContext, done) {
    assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

    callbacks.on(filePath, done);

    fd.send({
      type: 'compile',
      sourcePath: filePath,
      compiledPath: path.resolve(config.tempDir, HappyUtils.generateCompiledPath(filePath)),
      loaderContext: loaderContext
    });
  }
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}

function Once(fn) {
  var called = false;

  return function() {
    if (!called) {
      called = true;
      return fn.apply(null, arguments);
    }
  }
}