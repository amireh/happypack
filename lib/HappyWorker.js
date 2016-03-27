var fs = require('fs');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');
var serializeError = require('./serializeError');

function HappyWorker(options, fakeCompiler) {
  this.options = options;
  this._compiler = fakeCompiler;

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

  applyLoaders({
    compiler: this._compiler,
    loaders: this.options.loaders,
    loaderContext: params.loaderContext,
    compilerOptions: this.options.compilerOptions
  }, source, null, sourcePath, function(err, result) {
    if (err) {
      console.error(err);
      fs.writeFileSync(compiledPath, serializeError(err), 'utf-8');
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

module.exports = HappyWorker;
