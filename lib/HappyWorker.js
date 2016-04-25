var fs = require('fs');
var assert = require('assert');
var applyLoaders = require('./applyLoaders');
var serializeError = require('./serializeError');
var SourceMapSerializer = require('./SourceMapSerializer');

function HappyWorker(params) {
  this._compiler = params.compiler;
}

/**
 * @param  {Object} params
 * @param  {Object} params.loaderContext
 * @param  {String} params.loaderContext.resourcePath
 * @param  {String} params.compiledPath
 * @param  {Array.<String>} params.loaders
 * @param  {Function} done
 */
HappyWorker.prototype.compile = function(params, done) {
  assert(typeof params.loaderContext.resourcePath === 'string',
    "ArgumentError: expected params.sourcePath to contain path to the source file."
  );

  assert(typeof params.compiledPath === 'string',
    "ArgumentError: expected params.compiledPath to contain path to the compiled file."
  );

  assert(Array.isArray(params.loaders),
    "ArgumentError: expected params.loaders to contain a list of loaders."
  );

  applyLoaders({
    compiler: this._compiler,
    loaders: params.loaders,
    loaderContext: params.loaderContext,
  }, params.loaderContext.sourceCode, params.loaderContext.sourceMap, function(err, source, sourceMap) {
    var compiledPath = params.compiledPath;
    var success = false;

    if (err) {
      console.error(err);
      fs.writeFileSync(compiledPath, serializeError(err), 'utf-8');
    }
    else {
      fs.writeFileSync(compiledPath, source);
      fs.writeFileSync(compiledPath + '.map', SourceMapSerializer.serialize(sourceMap));

      success = true;
    }

    done({
      sourcePath: params.loaderContext.resourcePath,
      compiledPath: compiledPath,
      success: success
    });
  });
};

module.exports = HappyWorker;
