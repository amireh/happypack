var path = require('path');
var spawn = require('child_process').spawn;
var assert = require('assert');
var RawStream = require('./JSONStream');
var HappyUtils = require('./HappyUtils');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorker.js');

function HappyCompilerThread(threadId, config, hooks) {
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
    open: function() {
      fd = spawn(WORKER_BIN, [JSON.stringify(config.loaders)], {
        stdio: [ 'pipe', 'pipe', 'inherit' ],
      });

      fd.on('error', hooks.onError);

      stream = RawStream(fd.stdout, fd.stdin);
      stream.on('data', function(messages) {
        if (process.env.VERBOSE) {
          console.log('Thread[%d]: %d files have been compiled.', threadId, messages.length);
        }

        messages.forEach(function(fragments) {
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

module.exports = HappyCompilerThread;
