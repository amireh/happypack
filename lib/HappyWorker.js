#!/usr/bin/env node

var fs = require('fs');
var JSONStream = require('./JSONStream');
var JSONSerializer = require('./JSONSerializer');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  var optionsFilePath = process.argv[2];
  var options = JSONSerializer.deserialize(fs.readFileSync(optionsFilePath, 'utf-8'));
  var stream = JSONStream(process.stdin, process.stdout);

  start(stream, options);

  process.stdin.resume();
}

function start(stream, options) {
  assert(Array.isArray(options.loaders));
  assert('object' === typeof options.compilerOptions);

  stream.on('data', function(messages) {
    messages.forEach(function(message) {
      assert(typeof message === 'object', "Bad message; expected an object!");

      var sourcePath = message.sp;
      var compiledPath = message.cp;

      assert(typeof sourcePath === 'string',
        "Bad message; expected @sp to contain path to the source file!"
      );

      assert(typeof compiledPath === 'string',
        "Bad message; expected @cp to contain path to the compiled file!"
      );

      var success = false;
      var source = fs.readFileSync(sourcePath, 'utf-8');

      applyLoaders(options, source, null, sourcePath, function(err, result) {
        if (err) {
          console.error(err);
          fs.writeFileSync(compiledPath, err);
        }
        else {
          fs.writeFileSync(compiledPath, result.code /* TODO sourcemap */);
          success = true;
        }

        stream.write([
          sourcePath,
          compiledPath,
          success ? 'S' : 'F'
        ]);
      });
    });
  });

  stream.accept();
  stream.write({ id: 'ready' });
}

module.exports = start;