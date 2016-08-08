var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var Once = require('./fnOnce');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorkerChannel.js');

/**
 * @param {String|Number} id
 * @param {Object?} config
 * @param {Boolean} [config.verbose=false]
 * @param {Boolean} [config.debug=false]
 */
function HappyThread(id, happyRPCHandler, config) {
  config = config || {};

  var fd;
  var callbacks = {};
  var generateMessageId = (function() {
    var counter = 0;

    return function() {
      var nextId = ++counter;

      return 'Thread::' + id.toString() + ':' + nextId.toString();
    }
  }());

  return {
    open: function(onReady) {
      var emitReady = Once(onReady);

      fd = fork(WORKER_BIN, [id], {
        // Do not pass through any arguments that were passed to the main
        // process (webpack or node) because they could have unwanted
        // side-effects, see issue #47
        execArgv: []
      });

      fd.on('error', throwError);
      fd.on('exit', function(exitCode) {
        if (exitCode !== 0) {
          emitReady('HappyPack: worker exited abnormally with code ' + exitCode);
        }
      });

      fd.on('message', function acceptMessageFromWorker(message) {
        if (message.name === 'READY') {
          if (config.debug) {
            console.info('HappyThread[%s] is now open.', id);
          }

          emitReady();
        }
        else if (message.name === 'COMPILED') {
          var filePath = message.sourcePath;

          if (config.debug) {
            console.log('HappyThread[%s]: a file has been compiled. (request=%s)', id, filePath, message.id);
          }

          assert(typeof callbacks[message.id] === 'function',
            "HappyThread: expected loader to be pending on source file '" +
            filePath + "'" + " (this is likely an internal error!)"
          );

          callbacks[message.id](message);
          delete callbacks[message.id];
        }
        else if (message.name === 'COMPILER_REQUEST') {
          if (config.debug) {
            console.log('HappyThread[%s]: forwarding compiler request from worker to plugin:', id, message);
          }

          // TODO: DRY alert, see .createForegroundWorker() in HappyPlugin.js
          happyRPCHandler.execute(message.data.type, message.data.payload, function(error, result) {
            // console.log('forwarding compiler response from plugin back to worker:', error, result);

            fd.send({
              id: message.id, // downstream id
              name: 'COMPILER_RESPONSE',
              data: {
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

    configure: function(compilerOptions, done) {
      fd.once('message', function(message) {
        if (message.name === 'CONFIGURE_DONE') {
          done();
        }
      });

      fd.send({
        name: 'CONFIGURE',
        data: {
          compilerOptions: compilerOptions
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
      var messageId = generateMessageId();

      assert(params.compiledPath && typeof params.compiledPath === 'string');
      assert(params.loaderContext && typeof params.loaderContext === 'object');

      assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

      callbacks[messageId] = done;

      if (config.debug) {
        console.log('HappyThread[%s]: compiling "%s"...', id, params.loaderContext.resourcePath);
      }

      fd.send({
        id: messageId,
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

      if (config.debug) {
        console.info('HappyThread[%s] is now closed.', id);
      }
    },
  };
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}
