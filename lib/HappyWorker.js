var assert = require('assert');
var applyLoaders = require('./applyLoaders');
var ErrorSerializer = require('./ErrorSerializer');
var SourceMapSerializer = require('./SourceMapSerializer');

function HappyWorker(params) {
  this._compiler = params.compiler;
}

/**
 * @param  {Object} params
 * @param  {Object} params.loaderContext
 * @param  {String} params.loaderContext.sourceCode
 * @param  {?String|?Object} params.loaderContext.sourceMap
 * @param  {Array.<String>} params.loaders
 * @param  {Function} done
 */
HappyWorker.prototype.compile = function(params, done) {
  assert(typeof params.loaderContext.resourcePath === 'string',
    "ArgumentError: expected params.sourcePath to contain path to the source file."
  );

  assert(Array.isArray(params.loaders),
    "ArgumentError: expected params.loaders to contain a list of loaders."
  );

  applyLoaders({
    compiler: this._compiler,
    loaders: params.loaders,
    loaderContext: params.loaderContext,
  }, params.loaderContext.sourceCode, params.loaderContext.sourceMap, function(err, source, sourceMap) {
    if (err) {
      done(ErrorSerializer.serialize(err))
    }
    else {
      done(null, {
        compiledSource: source,
        compiledMap: SourceMapSerializer.serialize(sourceMap)
      });
    }
  });
};

module.exports = HappyWorker;
