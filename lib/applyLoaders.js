var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');

/**
 * @param {Object}            runContext
 * @param {HappyFakeCompiler} runContext.compiler
 * @param {Array.<Object>}    runContext.loaders
 * @param {Object}            runContext.loaderContext
 *
 * @param {String}            runContext.loaderContext.remoteLoaderId
 *        The ID of the HappyLoader instance that initiated this compilation
 *        request.
 *
 * @param {String}            runContext.loaderContext.request
 *        The full request for the resource including the loader chain string.
 *        Something like:
 *          '/path/to/style-loader.js!/path/to/css-loader.js!/path/to/resource.css'
 *
 * @param {String}            runContext.loaderContext.context
 *        The directory of the resource, useful for resolving siblings.
 *
 * @param {String}            runContext.loaderContext.resource
 *        The resource path without the loader chain.
 *
 * @param {String}            runContext.loaderContext.resourcePath
 *        The resource path without the query fragment.
 *
 * @param {String}            runContext.loaderContext.resourceQuery
 *        The query fragment of the resource path.
 *
 * @param {Object}            runContext.compilerOptions
 *
 * @param {String}            sourceCode
 * @param {String}            sourceMap
 * @param {Function}          done
 */
module.exports = function(runContext, sourceCode, sourceMap, done) {
  var cursor = 0;
  var result = { code: sourceCode, map: sourceMap };

  if (process.env.VERBOSE) {
    console.log('applying %d loaders (%s) against %s',
      runContext.loaders.length,
      JSON.stringify(runContext.loaders),
      runContext.loaderContext.resourcePath
    );
  }

  function apply() {
    var loader = runContext.loaders[cursor++];

    if (!loader) {
      return done(null, result);
    }

    // TODO: this is probably not the best place to create the context, and it
    // also should be cached at some layer
    var context = new HappyFakeLoaderContext(runContext.loaderContext.resourcePath);
    var transform = require(loader.path);

    context._compiler = runContext.compiler; // for compiler RPCs
    context._remoteLoaderId = runContext.loaderContext.remoteLoaderId; // for loader RPCs
    context.query = loader.query;
    context.options = runContext.compilerOptions;

    context.request = runContext.loaderContext.request;
    context.resource = runContext.loaderContext.resource;
    context.resourcePath = runContext.loaderContext.resourcePath;
    context.resourceQuery = runContext.loaderContext.resourceQuery;
    context.context = runContext.loaderContext.context;

    context.loaders = runContext.loaders;
    context.loaderIndex = cursor - 1;

    if (transform.pitch) {
      throw new Error('pitch loaders are not supported!')
    }

    applySyncOrAsync(transform, context, result, acceptResultAndApplyNext);
  }

  function acceptResultAndApplyNext(err, code, map) {
    if (err) {
      return done(err);
    }

    result.code = code;
    result.map = map;

    apply();
  }

  process.nextTick(apply);
}

function applySyncOrAsync(fn, context, previousResult, done) {
  // sync/async this.callback() style
  context.callback = done;

  try {
    // synchronus return style
    var result = fn.call(context, previousResult.code, previousResult.map);

    if (result) {
      done(null, result);
    }
  }
  catch(e) { // abort the chain
    done(e);
  }
}

// function applyPitchLoaders(request, loaders, createContext, done) {
//   var transforms = loaders.map(function(l) { return require(l.path); });
//   var pitchLoaders = transforms.filter(function(t) { return t.pitch instanceof Function; });

//   (function applyPitchLoader(cursor) {
//     var loader = pitchLoaders[cursor];

//     if (!loader) {
//       return done();
//     }

//     var data = {};
//     var remainingRequest =

//     applySyncOrAsync(transform.pitch, context, [ remainingRequest, precedingRequest, data ], function(err) {
//       if (err) {
//         return done(err);
//       }

//       var result = Array.prototype.slice.call(arguments, 1);
//       if (result.length > 0) {

//       }
//     });

//     return applyPitchLoader(cursor+1);
//   }(0));
// }
