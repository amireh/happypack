var fs = require('fs');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');
var serializeError = require('./serializeError');

function HappyWorker(params) {
  assert(Array.isArray(params.loaders),
    "Expected worker options to contain a @loaders array.");

  this._loaders = params.loaders;
  this._compiler = params.compiler;
}

HappyWorker.prototype.compile = function(params, done) {
  assert(typeof params.loaderContext.resourcePath === 'string',
    "Bad message; expected @sourcePath to contain path to the source file!"
  );

  assert(typeof params.compiledPath === 'string',
    "Bad message; expected @compiledPath to contain path to the compiled file!"
  );

  var sourcePath = params.loaderContext.resourcePath;
  var compiledPath = params.compiledPath;
  var success = false;
  var source = fs.readFileSync(sourcePath, 'utf-8');

  applyLoaders({
    compiler: this._compiler,
    loaders: this._loaders,
    loaderContext: params.loaderContext,
  }, source, null, function(err, code/*, map*/) {
    if (err) {
      console.error(err);
      fs.writeFileSync(compiledPath, serializeError(err), 'utf-8');
    }
    else {
      fs.writeFileSync(compiledPath, code /* TODO sourcemap */);
      success = true;
    }

    done({
      sourcePath: sourcePath,
      compiledPath: compiledPath,
      success: success
    });
  });
};

module.exports = HappyWorker;
