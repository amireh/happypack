#!/usr/bin/env node

var fs = require('fs');
var JSONSerializer = require('./JSONSerializer');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var HappyWorker = require('./HappyWorker');

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  var id = String(process.argv[2]);
  var optionsFilePath = process.argv[3];
  var options = JSONSerializer.deserialize(fs.readFileSync(optionsFilePath, 'utf-8'));

  start(id, process, options);
}

function start(id, stream, options) {
  var fakeCompiler = new HappyFakeCompiler(id, stream.send.bind(stream), options.compilerOptions);
  var worker = new HappyWorker({
    loaders: options.loaders,
    compiler: fakeCompiler
  });

  stream.on('message', accept);
  stream.send({ name: 'READY' });

  function accept(message) {
    if (message.name === 'COMPILER_RESPONSE') {
      fakeCompiler._handleResponse(message.data);
    }
    else if (message.name === 'COMPILE') {
      worker.compile(message.data, function(result) {
        stream.send({
          name: 'COMPILED',
          sourcePath: result.sourcePath,
          compiledPath: result.compiledPath,
          success: result.success
        });
      });
    }
    else {
      console.warn('ignoring unknown message:', message);
    }
  }
}

module.exports = start;