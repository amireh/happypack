var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var HappyLogger = require('./HappyLogger');
var HappyRPCHandler = require('./HappyRPCHandler');
var Once = require('./fnOnce');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorkerChannel.js');

function HappyThread(threadId, config) {
  var fd;
  var callbacks = {};

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
          HappyLogger.info('Happy thread[%d] is now open.', threadId);

          emitReady();
        }
        else if (message.name === 'COMPILED') {
          var filePath = message.sourcePath;

          HappyLogger.info('Thread[%d]: a file has been compiled.', threadId, filePath);

          assert(typeof callbacks[filePath] === 'function',
            "HappyThread: expected loader to be pending on source file '" +
            filePath + "'" + " (this is likely an internal error!)"
          );

          callbacks[filePath](message);
          delete callbacks[filePath];
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

    /**
     * @param {Object} params
     * @param {String} params.compiledPath
     * @param {Object} params.loaderContext
     *
     * @param {Function} done
     */
    compile: function(params, done) {
      assert(params.compiledPath && typeof params.compiledPath === 'string');
      assert(params.loaderContext && typeof params.loaderContext === 'object');

      assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

      callbacks[params.loaderContext.resourcePath] = done;

      fd.send({
        name: 'COMPILE',
        data: params,
      });
    },

    isOpen: function() {
      return !!fd;
    },

    close: function() {
      fd.kill('SIGINT');
      fd = null;

      HappyLogger.info('Happy thread[%d] is now closed.', threadId);
    },
  };
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}
