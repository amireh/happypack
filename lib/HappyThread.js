var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var HappyUtils = require('./HappyUtils');
var HappyLogger = require('./HappyLogger');
var HappyRPCHandler = require('./HappyRPCHandler');
var events = require('events');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorkerChannel.js');
var EventEmitter = events.EventEmitter || events;

function HappyThread(threadId, config) {
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

      fd.on('message', function acceptMessageFromWorker(message) {
        if (message.name === 'READY') {
          if (process.env.VERBOSE) {
            console.log('Happy thread[%d] is now open.', threadId);
          }

          emitReady();
        }
        else if (message.name === 'COMPILED') {
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
        else if (message.name === 'COMPILER_REQUEST') {
          HappyLogger.debug('forwarding compiler request from worker to plugin:', message);

          HappyRPCHandler.execute(message.data.type, message.data.payload, function(error, result) {
            // console.log('forwarding compiler response from plugin back to worker:', error, result);

            fd.send({
              name: 'COMPILER_RESPONSE',
              data: {
                id: message.data.id,
                payload: {
                  error: error || null,
                  result: result || null
                }
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
      name: 'COMPILE',
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