var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var HappyLogger = require('./HappyLogger');
var HappyRPCHandler = require('./HappyRPCHandler');
var Once = require('./fnOnce');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorkerChannel.js');

function HappyThread(id) {
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
          HappyLogger.info('Happy thread[%d] is now open.', id);

          emitReady();
        }
        else if (message.name === 'COMPILED') {
          var filePath = message.sourcePath;

          HappyLogger.info('Thread[%d]: a file has been compiled. (request=%s)', id, filePath, message.id);

          assert(typeof callbacks[message.id] === 'function',
            "HappyThread: expected loader to be pending on source file '" +
            filePath + "'" + " (this is likely an internal error!)"
          );

          callbacks[message.id](message);
          delete callbacks[message.id];
        }
        else if (message.name === 'COMPILER_REQUEST') {
          HappyLogger.debug('forwarding compiler request from worker to plugin:', message);

          // TODO: DRY alert, see .createForegroundWorker() in HappyPlugin.js
          HappyRPCHandler.execute(message.data.type, message.data.payload, function(error, result) {
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
      HappyLogger.info('Thread[%d]: compiling "%s"...', id, params.loaderContext.resourcePath);

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

      HappyLogger.info('Happy thread[%d] is now closed.', id);
    },
  };
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}
