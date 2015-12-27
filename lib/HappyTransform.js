#!/usr/bin/env node

var fs = require('fs');
var RawStream = require('./RawStream');
var transform = require(process.argv[2]);

var stream = RawStream(function(messages) {
  messages.forEach(function(message) {
    var fragments = stream.deserialize(message);
    var sourcePath = fragments[0];
    var compiledPath = fragments[1];
    var success = false;

    try {
      fs.writeFileSync(compiledPath, transform(fs.readFileSync(sourcePath, 'utf-8'), sourcePath));
      success = true;
    }
    catch(e) {
      // TODO this will wreak havoc if we can't write to the FS
      fs.writeFileSync(compiledPath, e.message + '\n' + e.codeFrame);
    }

    process.stdout.write(stream.serialize([
      sourcePath,
      compiledPath,
      success ? 'S' : 'F'
    ]));
  });
});

process.stdin.resume();
process.stdin.on('data', stream.read);
