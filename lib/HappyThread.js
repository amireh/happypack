var path = require('path');
var spawn = require('child_process').spawn;
var assert = require('assert');
var RawStream = require('./JSONStream');
var HappyUtils = require('./HappyUtils');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorker.js');

function HappyThread(threadId, config, hooks) {
  var fd, stream;

  function compile(filePaths) {
    assert(!!fd, "You must launch a compilation thread before attemping to use it!!!");

    filePaths.forEach(compileFile);
  }

  function compileFile(filePath) {
    var compiledPath = path.resolve(config.tempDir, HappyUtils.generateCompiledPath(filePath));

    stream.write({ sp: filePath, cp: compiledPath });
  }

  return {
    open: function(onReady) {
      var readyCalled = false;
      var emitReady = function() {
        readyCalled = true;

        if (onReady) {
          onReady.apply(null, arguments);
        }
      };

      fd = spawn(WORKER_BIN, [config.optionsPath], {
        stdio: [ 'pipe', 'pipe', 'inherit' ],
      });

      fd.on('error', hooks.onError);
      fd.on('exit', function(exitCode) {
        if (exitCode !== 0 && !readyCalled) {
          emitReady('HappyPack: worker exited abnormally with code ' + exitCode);
        }
      });

      stream = RawStream(fd.stdout, fd.stdin);
      stream.on('data', function(messages) {
        if (process.env.VERBOSE) {
          console.log('Thread[%d]: %d files have been compiled.', threadId, messages.length);
        }

        messages.forEach(function(fragments) {
          if (fragments.id === 'ready') {
            return emitReady();
          }

          var sourcePath = fragments[0];
          var compiledPath = fragments[1];
          var hasFailed = fragments[2] === 'F';

          hooks.onFile(sourcePath, compiledPath, hasFailed);
        });
      });

      stream.accept();

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now open.', threadId);
      }
    },

    isOpen: function() {
      return !!fd;
    },

    close: function() {
      stream = null;
      fd.kill('SIGINT');
      fd = null;

      if (process.env.VERBOSE) {
        console.log('Happy thread[%d] is now closed.', threadId);
      }
    },

    compile: compile,
  };
}

module.exports = HappyThread;
