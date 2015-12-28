#!/usr/bin/env node

var fs = require('fs');
var RawStream = require('./RawStream');
var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');
var transform = require(process.argv[2]);

var stream = RawStream(process.stdin, process.stdout);

stream.on('data', function(messages) {
  messages.forEach(function(fragments) {
    var sourcePath = fragments[0];
    var compiledPath = fragments[1];
    var success = false;
    var source = fs.readFileSync(sourcePath, 'utf-8');
    var context = new HappyFakeLoaderContext(source, sourcePath);


    try {
      fs.writeFileSync(compiledPath, transform.call(context, source, sourcePath));
      success = true;
    }
    catch(e) {
      console.error(e.stack);
      // TODO this will wreak havoc if we can't write to the FS
      fs.writeFileSync(compiledPath, e.message + '\n' + e.codeFrame);
    }

    stream.write([
      sourcePath,
      compiledPath,
      success ? 'S' : 'F'
    ]);
  });
});

process.stdin.resume();
stream.accept();
