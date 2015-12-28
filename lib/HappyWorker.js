#!/usr/bin/env node

var fs = require('fs');
var JSONStream = require('./JSONStream');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');

if (process.argv[1] === __filename) {
  start(JSONStream(process.stdin, process.stdout), JSON.parse(process.argv[2]));

  process.stdin.resume();
}

function start(stream, loaders) {
  assert(Array.isArray(loaders));

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

      applyLoaders(loaders, source, sourcePath, function(err, result) {
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
}

module.exports = start;