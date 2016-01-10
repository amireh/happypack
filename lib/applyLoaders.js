var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');

module.exports = function(runContext, source, inputSourceMap, sourcePath, done) {
  var cursor = 0;
  var result = { code: source, map: inputSourceMap };
  var loaders = runContext.loaders;
  var loaderContext = runContext.loaderContext || {};

  if (process.env.VERBOSE) {
    console.log('applying %d loaders (%s) against %s', loaders.length,
      JSON.stringify(
        loaders
      ), sourcePath);
  }

  console.log(loaderContext);

  function apply() {
    var loader = loaders[cursor++];

    if (!loader) {
      return done(null, result);
    }

    var context = new HappyFakeLoaderContext(source, sourcePath);
    var transform = require(loader.path);
    var code;

    context._compiler = runContext.compiler;
    context.query = loader.query;
    context.options = runContext.compilerOptions;
    context.context = loaderContext.context;

    // sync/async this.callback() style
    // context.callback = acceptResultAndApplyNext;

    if (transform.pitch) {
      throw new Error('pitch loaders are not supported!')
    }

    applyAsync(transform, context, [ result.code, result.map ], acceptResultAndApplyNext);
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

function applyAsync(fn, context, args, done) {
  context.callback = done;

  try {
    // synchronus return style
    var result = fn.apply(context, args);

    if (result) {
      done(null, code);
    }
  }
  catch(e) { // abort the chain
    console.error(e);
    done(e);
  }
}

function applyPitchLoaders(request, loaders, createContext, done) {
  var transforms = loaders.map(function(l) { return require(l.path); });
  var pitchLoaders = transforms.filter(function(t) { return t.pitch instanceof Function; });

  (function applyPitchLoader(cursor) {
    var loader = pitchLoaders[cursor];

    if (!loader) {
      return done();
    }

    var data = {};
    var remainingRequest =

    applyAsync(transform.pitch, context, [ remainingRequest, precedingRequest, data ], function(err) {
      if (err) {
        return done(err);
      }

      var result = Array.prototype.slice.call(arguments, 1);
      if (result.length > 0) {

      }
    });

    return applyPitchLoader(cursor+1);
  }(0));
}
