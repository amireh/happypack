var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');

module.exports = function(options, source, inputSourceMap, sourcePath, done) {
  var cursor = 0;
  var result = { code: source, map: inputSourceMap };
  var loaders = options.loaders;

  if (process.env.VERBOSE) {
    console.log('applying %d loaders (%s) against %s', loaders.length,
      JSON.stringify(
        loaders
      ), sourcePath);
  }

  function apply() {
    var loader = loaders[cursor++];

    if (!loader) {
      return done(null, result);
    }
    var context = new HappyFakeLoaderContext(source, sourcePath, loader.query, options.compilerOptions);
    var transform = require(loader.path);
    var code;

    // sync/async this.callback() style
    context.callback = acceptResultAndApplyNext;

    try {
      // synchronus return style

      code = transform.call(context, result.code, result.map);
    }
    catch(e) { // abort the chain
      console.error(e);
      return done(e);
    }

    if (code) {
      context.callback(null, code, null);
    }
  }

  function acceptResultAndApplyNext(err, code, map) {
    if (err) {
      return done(err);
    }

    result.code = code;
    result.map = map;

    apply();
  }

  apply();
}