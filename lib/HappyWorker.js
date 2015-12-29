#!/usr/bin/env node

var fs = require('fs');
var JSONSerializer = require('./JSONSerializer');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  var optionsFilePath = process.argv[2];
  var options = JSONSerializer.deserialize(fs.readFileSync(optionsFilePath, 'utf-8'));

  start(process, options);
}

function start(stream, options) {
  var worker;

  worker = new HappyWorker(options);

  stream.on('message', function(message) {
    if (message.id === 'compile') {
      worker.compile(message, function(err, result) {
        stream.send({
          id: 'compiled',
          sourcePath: result.sourcePath,
          compiledPath: result.compiledPath,
          success: result.success
        });
      });
    }
    else {
      console.warn('ignoring unknown message:', message);
    }
  });

  stream.send({ id: 'ready' });
}

function HappyWorker(options) {
  this.options = options;

  assert(Array.isArray(options.loaders),
    "Expected worker options to contain a @loaders array.");

  assert('object' === typeof options.compilerOptions,
    "Expected worker options to contain @compiledOptions.");

}

HappyWorker.prototype.compile = function(params, done) {
  assert(typeof params.sourcePath === 'string',
    "Bad message; expected @sourcePath to contain path to the source file!"
  );

  assert(typeof params.compiledPath === 'string',
    "Bad message; expected @compiledPath to contain path to the compiled file!"
  );

  var sourcePath = params.sourcePath;
  var compiledPath = params.compiledPath;
  var success = false;
  var source = fs.readFileSync(sourcePath, 'utf-8');

  applyLoaders(this.options, source, null, sourcePath, function(err, result) {
    if (err) {
      console.error(err);
      fs.writeFileSync(compiledPath, err);
    }
    else {
      fs.writeFileSync(compiledPath, result.code /* TODO sourcemap */);
      success = true;
    }

    done(err, {
      sourcePath: sourcePath,
      compiledPath: compiledPath,
      success: success
    });
  });
};

exports.Worker = HappyWorker;
exports.Channel = start;